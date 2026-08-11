// The pitch model. Everything about "which note is this" lives here and is pure:
// no DOM, no stores, no randomness. Staff position is derived from the diatonic
// index so a note's vertical place on the staff is a plain function of its letter
// and octave, which makes the whole thing unit-testable.

export type Step = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

/** -1 = flat, 0 = natural, 1 = sharp. Kept narrow on purpose. */
export type Alter = -1 | 0 | 1;

export type Pitch = {
	step: Step;
	octave: number;
	alter: Alter;
};

export const STEPS: readonly Step[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// Semitone offset of each natural step from C, for MIDI/frequency math.
const SEMITONE: Record<Step, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function stepIndex(step: Step): number {
	return STEPS.indexOf(step);
}

/**
 * A single number that increases as the note climbs the staff, counting only
 * letter positions (so F, F#, and Fb all share one index). This IS the vertical
 * staff position, up to a constant per clef.
 */
export function diatonicIndex(pitch: Pitch): number {
	return pitch.octave * 7 + stepIndex(pitch.step);
}

/** Inverse of diatonicIndex, always returning a natural pitch. */
export function pitchFromDiatonic(index: number): Pitch {
	const octave = Math.floor(index / 7);
	const step = STEPS[((index % 7) + 7) % 7];
	return { step, octave, alter: 0 };
}

export function withAlter(pitch: Pitch, alter: Alter): Pitch {
	return { ...pitch, alter };
}

/** MIDI note number. C4 = 60. Handy for the future mic/MIDI input work. */
export function midi(pitch: Pitch): number {
	return (pitch.octave + 1) * 12 + SEMITONE[pitch.step] + pitch.alter;
}

// How each of the 12 pitch classes (0 = C) is spelled. Black keys are spelled as
// sharps, the convention this app already uses everywhere else.
const PITCH_CLASS: readonly { step: Step; alter: Alter }[] = [
	{ step: 'C', alter: 0 },
	{ step: 'C', alter: 1 },
	{ step: 'D', alter: 0 },
	{ step: 'D', alter: 1 },
	{ step: 'E', alter: 0 },
	{ step: 'F', alter: 0 },
	{ step: 'F', alter: 1 },
	{ step: 'G', alter: 0 },
	{ step: 'G', alter: 1 },
	{ step: 'A', alter: 0 },
	{ step: 'A', alter: 1 },
	{ step: 'B', alter: 0 }
];

/**
 * Inverse of `midi()`: the pitch for a MIDI number, spelling black keys as
 * sharps. This is what turns a detected/played note back into something we can
 * show on the staff. Non-integer inputs are rounded to the nearest semitone.
 */
export function pitchFromMidi(midiNumber: number): Pitch {
	const rounded = Math.round(midiNumber);
	const octave = Math.floor(rounded / 12) - 1;
	const pitchClass = ((rounded % 12) + 12) % 12;
	const { step, alter } = PITCH_CLASS[pitchClass];
	return { step, octave, alter };
}

/**
 * Did a played note answer the note on the staff? In Play Mode the octave is
 * part of the reading, so the default is an exact match (enharmonics like F#/Gb
 * count as equal because they are the same key). `anyOctave` loosens it to "the
 * right note in any octave", a gentler beginner setting.
 */
export function playedMatches(target: Pitch, played: Pitch, anyOctave: boolean): boolean {
	const targetMidi = midi(target);
	const playedMidi = midi(played);
	if (anyOctave) return playedMidi % 12 === targetMidi % 12;
	return playedMidi === targetMidi;
}

function alterSymbol(alter: Alter): string {
	if (alter === 1) return '#';
	if (alter === -1) return 'b';
	return '';
}

/** VexFlow key string, e.g. { C, 4, 0 } -> "c/4" and { F, 5, 1 } -> "f#/5". */
export function toVexKey(pitch: Pitch): string {
	return `${pitch.step.toLowerCase()}${alterSymbol(pitch.alter)}/${pitch.octave}`;
}

/** Stable id used as a stats key and for display, e.g. "C4", "F#5". */
export function pitchId(pitch: Pitch): string {
	return `${pitch.step}${alterSymbol(pitch.alter)}${pitch.octave}`;
}

/** Human label with a proper sharp/flat glyph, e.g. "F♯5". */
export function pitchLabel(pitch: Pitch): string {
	const glyph = pitch.alter === 1 ? '♯' : pitch.alter === -1 ? '♭' : '';
	return `${pitch.step}${glyph}${pitch.octave}`;
}
