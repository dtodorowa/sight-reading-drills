import { describe, it, expect } from 'vitest';
import { detectPitch, hzToMidi } from './pitch-detect';

const SAMPLE_RATE = 44100;
const FRAME = 2048;

/** A pure sine tone at `hz`, the cleanest possible single note. */
function sine(hz: number, amplitude = 0.8, size = FRAME): Float32Array {
	const frame = new Float32Array(size);
	for (let i = 0; i < size; i++) {
		frame[i] = amplitude * Math.sin((2 * Math.PI * hz * i) / SAMPLE_RATE);
	}
	return frame;
}

/** A band-limited sawtooth: rich in harmonics, like a real instrument, to make
 *  sure we lock onto the fundamental and not an overtone. */
function saw(hz: number, harmonics = 12, size = FRAME): Float32Array {
	const frame = new Float32Array(size);
	for (let n = 1; n <= harmonics; n++) {
		for (let i = 0; i < size; i++) {
			frame[i] += (0.6 / n) * Math.sin((2 * Math.PI * hz * n * i) / SAMPLE_RATE);
		}
	}
	return frame;
}

describe('hzToMidi', () => {
	it('maps concert A to 69', () => {
		expect(hzToMidi(440)).toBeCloseTo(69, 6);
	});

	it('maps middle C to 60', () => {
		expect(hzToMidi(261.6256)).toBeCloseTo(60, 3);
	});

	it('an octave up is +12 semitones', () => {
		expect(hzToMidi(880) - hzToMidi(440)).toBeCloseTo(12, 6);
	});
});

describe('detectPitch', () => {
	it('finds the pitch of a clean sine within a few cents', () => {
		const reading = detectPitch(sine(440), SAMPLE_RATE);
		expect(reading).not.toBeNull();
		// Within 5 cents of A4.
		expect(Math.abs(hzToMidi(reading!.hz) - 69)).toBeLessThan(0.05);
		expect(reading!.clarity).toBeGreaterThan(0.95);
	});

	it('reads notes across the piano range it targets', () => {
		// A2, C4, A4, A5: bass through treble.
		for (const [hz, expectedMidi] of [
			[110, 45],
			[261.6256, 60],
			[440, 69],
			[880, 81]
		] as const) {
			const reading = detectPitch(saw(hz), SAMPLE_RATE);
			expect(reading).not.toBeNull();
			expect(Math.round(hzToMidi(reading!.hz))).toBe(expectedMidi);
		}
	});

	it('locks onto the fundamental of a harmonic-rich tone, not an overtone', () => {
		const reading = detectPitch(saw(146.83), SAMPLE_RATE); // D3
		expect(reading).not.toBeNull();
		// Must be near D3 (~146.83 Hz), not an octave/fifth above.
		expect(reading!.hz).toBeGreaterThan(140);
		expect(reading!.hz).toBeLessThan(154);
	});

	it('returns null for silence', () => {
		expect(detectPitch(new Float32Array(FRAME), SAMPLE_RATE)).toBeNull();
	});

	it('returns null for a near-silent frame below the RMS floor', () => {
		expect(detectPitch(sine(440, 0.001), SAMPLE_RATE)).toBeNull();
	});

	it('returns null for white noise (nothing tonal to lock onto)', () => {
		// Deterministic pseudo-noise so the test never flakes.
		const frame = new Float32Array(FRAME);
		let seed = 1234567;
		for (let i = 0; i < FRAME; i++) {
			seed = (seed * 1103515245 + 12345) & 0x7fffffff;
			frame[i] = (seed / 0x3fffffff - 1) * 0.8;
		}
		expect(detectPitch(frame, SAMPLE_RATE)).toBeNull();
	});
});
