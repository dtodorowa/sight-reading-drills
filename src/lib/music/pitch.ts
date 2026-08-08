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
