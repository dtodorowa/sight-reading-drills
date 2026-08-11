// The play-a-line round. Owns which note of an etude you are on, checks each
// note you play against it, and advances only when you hit the right one, so you
// read and play a whole line in order. Pure scoring (playedMatches) and the
// exercise data live in $lib/music and $lib/learn; this is just the reactive
// shell, the etude cousin of the single-note Drill store.

import { playedMatches, type Pitch } from '$lib/music/pitch';
import { cardId } from '$lib/music/levels';
import { exerciseById, noteCardAt, type Exercise } from '$lib/learn/exercises';
import { progress } from './progress.svelte';

export type EtudePhase = 'idle' | 'playing' | 'done';

export type AttemptResult = 'correct' | 'wrong' | 'ignored';

export class Etude {
	exercise = $state<Exercise | null>(null);
	/** Index of the note to play now. */
	index = $state(0);
	phase = $state<EtudePhase>('idle');
	/** Per-note first-attempt correctness, filled in as you pass each note. */
	firstTry = $state<boolean[]>([]);

	// One entry per note: has its first attempt been recorded to mastery yet?
	#firstAttemptDone: boolean[] = [];
	#noteStartedAt = 0;

	get current(): Pitch | null {
		if (!this.exercise || this.phase !== 'playing') return null;
		return this.exercise.notes[this.index] ?? null;
	}

	get total(): number {
		return this.exercise?.notes.length ?? 0;
	}

	/** How many notes you nailed on the very first try, the score that matters. */
	get firstTryCorrect(): number {
		return this.firstTry.filter((correct) => correct).length;
	}

	/** Load an exercise and start playing. Returns false if the id is unknown. */
	load(exerciseId: string, now: number): boolean {
		const exercise = exerciseById(exerciseId) ?? null;
		this.exercise = exercise;
		this.index = 0;
		this.firstTry = [];
		this.#firstAttemptDone = [];
		this.phase = exercise ? 'playing' : 'idle';
		this.#noteStartedAt = now;
		return exercise !== null;
	}

	restart(now: number) {
		if (this.exercise) this.load(this.exercise.id, now);
	}

	/**
	 * Try the current note with a played pitch. Octave matters here (reading the
	 * exact pitch off the staff is the skill). Advances only on the right note; a
	 * wrong note just flashes and you try again. Only the first attempt at each
	 * note is scored into the shared mastery stats, so retries do not pile up.
	 */
	attempt(played: Pitch, now: number): AttemptResult {
		if (this.phase !== 'playing' || !this.exercise) return 'ignored';

		const target = this.exercise.notes[this.index];
		const correct = playedMatches(target, played, false);

		if (!this.#firstAttemptDone[this.index]) {
			this.#firstAttemptDone[this.index] = true;
			this.firstTry[this.index] = correct;
			const responseMs = Math.max(0, now - this.#noteStartedAt);
			progress.recordAttempt(
				cardId(noteCardAt(this.exercise, this.index)),
				correct,
				responseMs,
				now
			);
		}

		if (!correct) return 'wrong';

		this.index += 1;
		this.#noteStartedAt = now;
		if (this.index >= this.exercise.notes.length) this.phase = 'done';
		return 'correct';
	}
}
