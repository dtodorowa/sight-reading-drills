// A learn "exercise" is a short single-line etude: a fixed sequence of notes on
// one clef, in one key, that you read left to right and play on your instrument.
// Rhythm is deliberately left out, this is pitch-shape reading, the foundation
// the whole course is built on before rhythm is layered in.
//
// The note data is generated from the learning-piano notebook by
// `tools/import-practice.mjs`; this file adds the type and the lookups over it.

import type { Clef, NoteCard } from '$lib/music/levels';
import type { Pitch } from '$lib/music/pitch';
import { EXERCISES } from './exercises.data';

export type Exercise = {
	/** Stable id, derived from the source filename (e.g. "gm-04-scale"). */
	id: string;
	title: string;
	clef: Clef;
	/** Human key label, e.g. "G minor". */
	keyName: string;
	/** The line to read and play, in order. */
	notes: Pitch[];
};

export { EXERCISES };

export function exerciseById(id: string): Exercise | undefined {
	return EXERCISES.find((exercise) => exercise.id === id);
}

/** The card used as the per-note mastery key, so etude reps feed the same stats. */
export function noteCardAt(exercise: Exercise, index: number): NoteCard {
	return { clef: exercise.clef, pitch: exercise.notes[index] };
}
