// A "level" is the thing you choose before a drill: a clef (or both) and the
// range of notes that can show up. Ranges climb in the classic order a reader
// learns them, so each level sits just past the previous one's edge, which is
// the "zone of proximal development" idea from the teach philosophy.

import { STEPS, diatonicIndex, pitchFromDiatonic, type Pitch, type Step } from './pitch';

export type Clef = 'treble' | 'bass';

/** One note as it will be drawn: which clef, and which pitch on it. */
export type NoteCard = {
	clef: Clef;
	pitch: Pitch;
};

/** A contiguous run of natural notes on one clef, inclusive of both ends. */
export type Segment = {
	clef: Clef;
	low: Pitch;
	high: Pitch;
};

export type Level = {
	id: string;
	label: string;
	blurb: string;
	segments: Segment[];
};

const at = (step: Step, octave: number): Pitch => ({ step, octave, alter: 0 });

/** Stable id for a card, used as the mastery-stats key. */
export function cardId(card: NoteCard): string {
	const { step, octave } = card.pitch;
	return `${card.clef}:${step}${octave}`;
}

/** Every natural note in a segment, low to high. */
function notesInSegment(segment: Segment): NoteCard[] {
	const start = diatonicIndex(segment.low);
	const end = diatonicIndex(segment.high);
	const cards: NoteCard[] = [];
	for (let index = start; index <= end; index++) {
		cards.push({ clef: segment.clef, pitch: pitchFromDiatonic(index) });
	}
	return cards;
}

/** Every note that can appear in a level. */
export function candidatesForLevel(level: Level): NoteCard[] {
	return level.segments.flatMap(notesInSegment);
}

// The on-staff notes only, then the same plus a few ledger lines, per clef, then
// the grand-staff combinations. Middle-C zone is called out on its own because
// the clef crossover around middle C is where most beginners stall.
export const LEVELS: Level[] = [
	{
		id: 'treble-staff',
		label: 'Treble: on the staff',
		blurb: 'The 9 notes sitting on the treble lines and spaces. E4 up to F5.',
		segments: [{ clef: 'treble', low: at('E', 4), high: at('F', 5) }]
	},
	{
		id: 'treble-ledger',
		label: 'Treble: with ledger lines',
		blurb: 'Adds middle C and the notes floating above and below the staff.',
		segments: [{ clef: 'treble', low: at('C', 4), high: at('A', 5) }]
	},
	{
		id: 'bass-staff',
		label: 'Bass: on the staff',
		blurb: 'The notes sitting on the bass lines and spaces. G2 up to A3.',
		segments: [{ clef: 'bass', low: at('G', 2), high: at('A', 3) }]
	},
	{
		id: 'bass-ledger',
		label: 'Bass: with ledger lines',
		blurb: 'Bass staff pushed down low and up to middle C.',
		segments: [{ clef: 'bass', low: at('E', 2), high: at('C', 4) }]
	},
	{
		id: 'middle-c-zone',
		label: 'Middle C crossover',
		blurb: 'The tricky handoff where treble and bass meet around middle C.',
		segments: [
			{ clef: 'treble', low: at('C', 4), high: at('G', 4) },
			{ clef: 'bass', low: at('F', 3), high: at('C', 4) }
		]
	},
	{
		id: 'grand-staff',
		label: 'Grand staff: on the staff',
		blurb: 'Both clefs at once. The bread and butter of piano reading.',
		segments: [
			{ clef: 'treble', low: at('E', 4), high: at('F', 5) },
			{ clef: 'bass', low: at('G', 2), high: at('A', 3) }
		]
	},
	{
		id: 'grand-full',
		label: 'Grand staff: the works',
		blurb: 'Both clefs plus ledger lines. Boss level.',
		segments: [
			{ clef: 'treble', low: at('C', 4), high: at('A', 5) },
			{ clef: 'bass', low: at('E', 2), high: at('C', 4) }
		]
	}
];

export function levelById(id: string): Level | undefined {
	return LEVELS.find((level) => level.id === id);
}

/** The 7 letter names, in reading order, for the answer pad. */
export const LETTERS: readonly Step[] = STEPS;
