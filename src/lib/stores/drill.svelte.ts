// The live round. Owns which note is on screen, times the answer, checks it, and
// hands the result to the progress store. Pure logic (picking, scoring) lives in
// $lib/music and $lib/stats; this class is just the reactive shell that drives a
// session and the clock.

import {
	candidatesForLevel,
	cardId,
	levelById,
	type Level,
	type NoteCard
} from '$lib/music/levels';
import { pickNote, pushRecent } from '$lib/music/picker';
import { playedMatches, type Pitch, type Step } from '$lib/music/pitch';
import type { Attempt } from '$lib/stats/session';
import { progress } from './progress.svelte';

const RECENT_WINDOW = 6;

export type Phase = 'idle' | 'asking' | 'revealed';

export class Drill {
	level = $state<Level | null>(null);
	current = $state<NoteCard | null>(null);
	phase = $state<Phase>('idle');
	/** null while asking, true/false once answered. */
	lastCorrect = $state<boolean | null>(null);
	/** The letter the player tapped, for the reveal UI. */
	lastGuess = $state<Step | null>(null);
	/** The full pitch the player played in Play Mode, for the reveal UI. */
	lastPlayed = $state<Pitch | null>(null);

	// Live session counters, surfaced to the drill screen.
	answered = $state(0);
	correct = $state(0);
	streak = $state(0);
	bestStreak = $state(0);

	#candidates: NoteCard[] = [];
	#recentIds: string[] = [];
	#attempts: Attempt[] = [];
	#questionStartedAt = 0;

	get accuracy(): number {
		return this.answered === 0 ? 0 : this.correct / this.answered;
	}

	get attempts(): readonly Attempt[] {
		return this.#attempts;
	}

	start(levelId: string, now: number) {
		const level = levelById(levelId) ?? null;
		this.level = level;
		this.#candidates = level ? candidatesForLevel(level) : [];
		this.#recentIds = [];
		this.#attempts = [];
		this.answered = 0;
		this.correct = 0;
		this.streak = 0;
		this.bestStreak = 0;
		this.lastCorrect = null;
		this.lastGuess = null;
		this.lastPlayed = null;
		this.#nextQuestion(now);
	}

	#nextQuestion(now: number) {
		if (this.#candidates.length === 0) {
			this.current = null;
			this.phase = 'idle';
			return;
		}
		const card = pickNote(
			this.#candidates,
			(id) => progress.statFor(id),
			this.#recentIds,
			Math.random
		);
		this.current = card;
		this.#recentIds = pushRecent(this.#recentIds, cardId(card), RECENT_WINDOW);
		this.#questionStartedAt = now;
		this.lastCorrect = null;
		this.lastGuess = null;
		this.lastPlayed = null;
		this.phase = 'asking';
	}

	/** Advance to the next note (called after the reveal pause). */
	next(now: number) {
		if (this.phase !== 'revealed') return;
		this.#nextQuestion(now);
	}

	/**
	 * Answer the current note with a letter (Tap Mode). Octave-insensitive, since
	 * the letter pad only names the note. Returns whether it was correct. No-op
	 * unless we are actively asking.
	 */
	answer(letter: Step, now: number): boolean {
		if (this.phase !== 'asking' || !this.current) return false;
		const correct = this.current.pitch.step === letter;
		this.lastGuess = letter;
		this.#score(correct, now);
		return correct;
	}

	/**
	 * Answer by playing a note (Play Mode). Octave matters here unless `anyOctave`
	 * is set, because reading the exact pitch off the staff is the whole skill.
	 * Records into the same mastery stats as Tap Mode, so progress is unified.
	 */
	answerPlayed(pitch: Pitch, now: number, anyOctave: boolean): boolean {
		if (this.phase !== 'asking' || !this.current) return false;
		const correct = playedMatches(this.current.pitch, pitch, anyOctave);
		this.lastPlayed = pitch;
		this.lastGuess = pitch.step;
		this.#score(correct, now);
		return correct;
	}

	// Shared bookkeeping for both answer paths: time the response, roll it into
	// mastery + session stats, bump the live counters, and reveal.
	#score(correct: boolean, now: number) {
		if (!this.current) return;
		const responseMs = Math.max(0, now - this.#questionStartedAt);
		const id = cardId(this.current);

		this.#attempts.push({ cardId: id, correct, responseMs });
		progress.recordAttempt(id, correct, responseMs, now);

		this.answered += 1;
		if (correct) {
			this.correct += 1;
			this.streak += 1;
			this.bestStreak = Math.max(this.bestStreak, this.streak);
		} else {
			this.streak = 0;
		}

		this.lastCorrect = correct;
		this.phase = 'revealed';
	}

	/** End the round and persist the summary. Safe to call more than once. */
	finish(now: number) {
		const offset = new Date().getTimezoneOffset();
		progress.finishSession(this.#attempts, now, offset);
		this.#attempts = [];
		this.phase = 'idle';
	}
}
