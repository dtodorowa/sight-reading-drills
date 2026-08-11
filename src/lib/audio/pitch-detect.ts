// The pitch-detection core. Pure DSP: takes a frame of audio samples plus its
// sample rate and returns the fundamental frequency, or null when the frame is
// too quiet or too noisy to trust. No DOM, no AudioContext, no time, no
// randomness, so it is fully unit-testable with synthesized buffers. The mic
// plumbing that feeds it lives in the browser-only shell (`mic.svelte.ts`).
//
// Method: the normalized square-difference function (NSDF), the heart of the
// McLeod pitch method. It behaves like a normalized autocorrelation whose peaks
// sit in the range -1..1, so the height of the chosen peak doubles as a clarity
// score. This handles piano's weak low fundamentals better than a raw FFT peak
// and, with the peak-picking rule below, dodges the octave errors autocorrelation
// is prone to.

export type PitchReading = {
	/** Estimated fundamental frequency in hertz. */
	hz: number;
	/** Confidence in 0..1: the height of the chosen NSDF peak. */
	clarity: number;
};

export type DetectOptions = {
	/** Lowest fundamental we will look for. Default A1 (55 Hz). */
	minHz?: number;
	/** Highest fundamental we will look for. Default ~A6 (1760 Hz). */
	maxHz?: number;
	/** Reject the frame below this RMS level (near-silence). */
	rmsFloor?: number;
	/** Reject readings whose peak sits below this clarity. */
	clarityThreshold?: number;
	/**
	 * When several NSDF peaks are close in height, prefer the earliest (highest
	 * pitched) one whose value clears this fraction of the tallest peak. This is
	 * what stops a note from being reported an octave too low.
	 */
	peakFraction?: number;
};

const DEFAULTS: Required<DetectOptions> = {
	minHz: 55,
	maxHz: 1760,
	rmsFloor: 0.01,
	clarityThreshold: 0.9,
	peakFraction: 0.85
};

/** Convert a frequency to a (fractional) MIDI note number. A4 (440 Hz) = 69. */
export function hzToMidi(hz: number): number {
	return 69 + 12 * Math.log2(hz / 440);
}

/**
 * Estimate the fundamental frequency of a single monophonic tone in `frame`.
 * Returns null for silence or an unclear/out-of-range reading rather than
 * guessing, so callers can simply wait for the next frame.
 */
export function detectPitch(
	frame: Float32Array,
	sampleRate: number,
	options: DetectOptions = {}
): PitchReading | null {
	const { minHz, maxHz, rmsFloor, clarityThreshold, peakFraction } = { ...DEFAULTS, ...options };
	const size = frame.length;

	// Silence gate: don't chase the noise floor.
	let sumOfSquares = 0;
	for (let i = 0; i < size; i++) {
		sumOfSquares += frame[i] * frame[i];
	}
	const rms = Math.sqrt(sumOfSquares / size);
	if (rms < rmsFloor) return null;

	// A period of `lag` samples means a frequency of sampleRate / lag, so the
	// frequency window maps to a lag window we search over.
	const minLag = Math.max(2, Math.floor(sampleRate / maxHz));
	const maxLag = Math.min(size - 1, Math.ceil(sampleRate / minHz));
	if (maxLag <= minLag) return null;

	// NSDF over the lag window: nsdf[lag] = 2 * correlation / (energy at both offsets).
	const nsdf = new Float32Array(maxLag + 1);
	for (let lag = minLag; lag <= maxLag; lag++) {
		let correlation = 0;
		let energy = 0;
		for (let i = 0; i < size - lag; i++) {
			const a = frame[i];
			const b = frame[i + lag];
			correlation += a * b;
			energy += a * a + b * b;
		}
		nsdf[lag] = energy > 0 ? (2 * correlation) / energy : 0;
	}

	// Collect local maxima (candidate periods). The tallest is usually the true
	// period, but a sub-octave peak can occasionally edge it out, so we then take
	// the *earliest* peak that is nearly as tall.
	let tallest = 0;
	for (let lag = minLag + 1; lag < maxLag; lag++) {
		if (nsdf[lag] > nsdf[lag - 1] && nsdf[lag] >= nsdf[lag + 1]) {
			if (nsdf[lag] > tallest) tallest = nsdf[lag];
		}
	}
	if (tallest <= 0) return null;

	const cutoff = tallest * peakFraction;
	let chosenLag = -1;
	for (let lag = minLag + 1; lag < maxLag; lag++) {
		if (nsdf[lag] > nsdf[lag - 1] && nsdf[lag] >= nsdf[lag + 1] && nsdf[lag] >= cutoff) {
			chosenLag = lag;
			break;
		}
	}
	if (chosenLag < 0) return null;

	const clarity = nsdf[chosenLag];
	if (clarity < clarityThreshold) return null;

	// Parabolic interpolation around the peak for sub-sample period accuracy,
	// which is what makes the reading land within a few cents instead of a
	// whole quantized bin.
	const refinedLag = refinePeak(nsdf, chosenLag);
	const hz = sampleRate / refinedLag;
	if (hz < minHz || hz > maxHz) return null;

	return { hz, clarity };
}

/** Fit a parabola through the peak and its two neighbors; return the vertex lag. */
function refinePeak(nsdf: Float32Array, lag: number): number {
	const left = nsdf[lag - 1];
	const mid = nsdf[lag];
	const right = nsdf[lag + 1];
	const denominator = left - 2 * mid + right;
	if (denominator === 0) return lag;
	const shift = (0.5 * (left - right)) / denominator;
	return lag + shift;
}
