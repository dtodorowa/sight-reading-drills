// The browser-only shell around the microphone. This owns the messy, stateful
// I/O that the pure detector (`pitch-detect.ts`) deliberately has none of:
// permission prompts, the AudioContext lifecycle, an AnalyserNode, and the
// per-frame requestAnimationFrame loop. It exposes a small reactive surface the
// UI can bind to, and nothing here runs until `start()` is called from a user
// gesture, so it never touches the server render or prerender.
//
// It reads frames from the mic, hands each to `detectPitch`, and turns the
// result into a live note plus a debounced "held" note. Play Mode (#3) will read
// `confirmed` to score a played note; the tuner harness reads the live fields.

import { detectPitch, hzToMidi } from './pitch-detect';
import { pitchFromMidi, type Pitch } from '$lib/music/pitch';

export type MicStatus =
	| 'idle' // never started, or stopped
	| 'requesting' // waiting on the permission prompt
	| 'listening' // mic is live and we are analyzing
	| 'denied' // user said no to the mic
	| 'unsupported' // this browser has no mic / Web Audio
	| 'error'; // something else broke

// A 2048-sample frame at typical rates is ~45ms of audio: long enough to see a
// couple of periods of a low piano note, short enough to feel instant.
const FFT_SIZE = 2048;

// The DSP features browsers apply by default (echo cancellation, noise
// suppression, auto gain) all smear pitch, so we ask for a raw stream.
const RAW_AUDIO: MediaTrackConstraints = {
	echoCancellation: false,
	noiseSuppression: false,
	autoGainControl: false
};

// Hold the same note this long before we call it "confirmed", so a key's attack
// transient or a passing scale note doesn't count as an answer.
const STABLE_MS = 120;

type AudioContextConstructor = new () => AudioContext;

function audioContextClass(): AudioContextConstructor | null {
	if (typeof window === 'undefined') return null;
	const w = window as unknown as {
		AudioContext?: AudioContextConstructor;
		webkitAudioContext?: AudioContextConstructor;
	};
	return w.AudioContext ?? w.webkitAudioContext ?? null;
}

export class MicPitch {
	status = $state<MicStatus>('idle');
	/** A human-readable reason when status is 'error'. */
	errorMessage = $state<string | null>(null);

	// Live reading, refreshed every animation frame. All null when nothing tonal
	// is coming through right now.
	hz = $state<number | null>(null);
	clarity = $state(0);
	pitch = $state<Pitch | null>(null);
	/** Cents sharp (+) or flat (-) of the nearest semitone, for a tuning meter. */
	cents = $state(0);

	/** The note we have heard steadily for STABLE_MS. Cleared when the sound stops. */
	confirmed = $state<Pitch | null>(null);

	#stream: MediaStream | null = null;
	#context: AudioContext | null = null;
	#analyser: AnalyserNode | null = null;
	#buffer: Float32Array<ArrayBuffer> = new Float32Array(FFT_SIZE);
	#frameId: number | null = null;

	// Debounce bookkeeping for `confirmed`.
	#candidateMidi: number | null = null;
	#candidateSince = 0;

	get isRunning(): boolean {
		return this.status === 'listening';
	}

	/** Ask for the mic and begin analyzing. Must be called from a user gesture. */
	async start(): Promise<void> {
		if (this.status === 'listening' || this.status === 'requesting') return;

		const AudioContextClass = audioContextClass();
		if (
			typeof navigator === 'undefined' ||
			!navigator.mediaDevices?.getUserMedia ||
			!AudioContextClass
		) {
			this.status = 'unsupported';
			return;
		}

		this.status = 'requesting';
		this.errorMessage = null;

		try {
			this.#stream = await navigator.mediaDevices.getUserMedia({ audio: RAW_AUDIO });
		} catch (error) {
			// Chrome/Safari both throw NotAllowedError when the user declines.
			if (error instanceof DOMException && error.name === 'NotAllowedError') {
				this.status = 'denied';
			} else {
				this.status = 'error';
				this.errorMessage = error instanceof Error ? error.message : 'could not open the mic';
			}
			return;
		}

		try {
			const context = new AudioContextClass();
			// iOS Safari starts contexts suspended; the gesture that called us lets
			// this resume.
			await context.resume();

			const analyser = context.createAnalyser();
			analyser.fftSize = FFT_SIZE;
			context.createMediaStreamSource(this.#stream).connect(analyser);

			this.#context = context;
			this.#analyser = analyser;
			this.#buffer = new Float32Array(analyser.fftSize);
			this.status = 'listening';
			this.#tick();
		} catch (error) {
			this.stop();
			this.status = 'error';
			this.errorMessage = error instanceof Error ? error.message : 'audio setup failed';
		}
	}

	/** Stop analyzing and release the mic. Safe to call any time. */
	stop(): void {
		if (this.#frameId !== null) {
			cancelAnimationFrame(this.#frameId);
			this.#frameId = null;
		}
		this.#stream?.getTracks().forEach((track) => track.stop());
		this.#stream = null;
		void this.#context?.close();
		this.#context = null;
		this.#analyser = null;
		this.#candidateMidi = null;
		this.#resetReading();
		this.confirmed = null;
		if (this.status === 'listening') this.status = 'idle';
	}

	#resetReading(): void {
		this.hz = null;
		this.clarity = 0;
		this.pitch = null;
		this.cents = 0;
	}

	#tick = (): void => {
		const analyser = this.#analyser;
		const context = this.#context;
		if (!analyser || !context) return;

		analyser.getFloatTimeDomainData(this.#buffer);
		const reading = detectPitch(this.#buffer, context.sampleRate);

		if (reading) {
			const midiFloat = hzToMidi(reading.hz);
			const nearest = Math.round(midiFloat);
			this.hz = reading.hz;
			this.clarity = reading.clarity;
			this.pitch = pitchFromMidi(nearest);
			this.cents = Math.round((midiFloat - nearest) * 100);
			this.#updateConfirmed(nearest, context.currentTime * 1000);
		} else {
			this.#resetReading();
			this.#candidateMidi = null;
			this.confirmed = null;
		}

		this.#frameId = requestAnimationFrame(this.#tick);
	};

	// Promote the live note to `confirmed` once it has held steady long enough.
	#updateConfirmed(midiNumber: number, nowMs: number): void {
		if (this.#candidateMidi !== midiNumber) {
			this.#candidateMidi = midiNumber;
			this.#candidateSince = nowMs;
			return;
		}
		if (nowMs - this.#candidateSince >= STABLE_MS) {
			const held = pitchFromMidi(midiNumber);
			// Only write when it actually changes, to avoid churning reactive readers.
			if (
				!this.confirmed ||
				this.confirmed.step !== held.step ||
				this.confirmed.octave !== held.octave ||
				this.confirmed.alter !== held.alter
			) {
				this.confirmed = held;
			}
		}
	}
}
