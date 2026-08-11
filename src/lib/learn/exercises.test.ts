import { describe, it, expect } from 'vitest';
import { EXERCISES, exerciseById, noteCardAt } from './exercises';
import { CHAPTERS, chapterForExercise } from './chapters';
import { cardId } from '$lib/music/levels';

describe('exercise data', () => {
	it('imported the full notebook', () => {
		expect(EXERCISES.length).toBe(12);
	});

	it('every exercise has a clef, a key, and at least a few notes', () => {
		for (const exercise of EXERCISES) {
			expect(['treble', 'bass']).toContain(exercise.clef);
			expect(exercise.keyName).toMatch(/minor|major/);
			expect(exercise.notes.length).toBeGreaterThanOrEqual(4);
		}
	});

	it('has no duplicate ids', () => {
		const ids = EXERCISES.map((exercise) => exercise.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('looks exercises up by id', () => {
		expect(exerciseById('gm-04-scale')?.title).toContain('One-Octave Scale');
		expect(exerciseById('nope')).toBeUndefined();
	});

	it('reuses the drill mastery key for its notes', () => {
		const scale = exerciseById('gm-04-scale')!;
		// G minor scale starts on G2 in the bass, matching the drill card id scheme.
		expect(cardId(noteCardAt(scale, 0))).toBe('bass:G2');
	});
});

describe('chapters', () => {
	it('every referenced exercise id resolves', () => {
		for (const chapter of CHAPTERS) {
			for (const id of chapter.exerciseIds) {
				expect(exerciseById(id), `${chapter.id} -> ${id}`).toBeDefined();
			}
		}
	});

	it('covers every exercise exactly once (no orphans, no dupes)', () => {
		const referenced = CHAPTERS.flatMap((chapter) => chapter.exerciseIds);
		expect(referenced.length).toBe(EXERCISES.length);
		expect(new Set(referenced).size).toBe(EXERCISES.length);
	});

	it('numbers chapters 1..N in order', () => {
		CHAPTERS.forEach((chapter, index) => expect(chapter.number).toBe(index + 1));
	});

	it('maps an exercise back to its chapter', () => {
		expect(chapterForExercise('gm-04-scale')?.id).toBe('scales');
	});

	it('keeps teaching copy free of em dashes', () => {
		for (const chapter of CHAPTERS) {
			expect(chapter.title).not.toContain('—');
			expect(chapter.intro).not.toContain('—');
		}
	});
});
