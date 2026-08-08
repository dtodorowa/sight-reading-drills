// The one place that owns everything we remember between sessions: per-note
// mastery, past session summaries, and the day streak. Backed by localStorage.
//
// It is loaded via init() from the root layout's onMount (not at import time), so
// the prerendered HTML and the first client render agree, then the real numbers
// pop in after mount.

import { loadJSON, saveJSON, removeKey } from './persist';
import { emptyStat, recordAttempt, type NoteStat } from '$lib/stats/mastery';
import {
	summarize,
	dayNumber,
	updateDayStreak,
	type Attempt,
	type SessionSummary
} from '$lib/stats/session';
import { LEVELS } from '$lib/music/levels';

const STORAGE_KEY = 'notedash.progress.v1';
const MAX_SESSIONS = 60;

type Persisted = {
	version: 1;
	byNote: Record<string, NoteStat>;
	sessions: SessionSummary[];
	totalAttempts: number;
	totalCorrect: number;
	dayStreak: number;
	lastPracticedDay: number | null;
	levelId: string;
};

function fresh(): Persisted {
	return {
		version: 1,
		byNote: {},
		sessions: [],
		totalAttempts: 0,
		totalCorrect: 0,
		dayStreak: 0,
		lastPracticedDay: null,
		levelId: LEVELS[0].id
	};
}

class ProgressStore {
	#data = $state<Persisted>(fresh());
	#loaded = $state(false);

	/** True once localStorage has been read. Use to gate rendering of stats. */
	get loaded() {
		return this.#loaded;
	}

	/** Load persisted state. Call once, from the browser (layout onMount). */
	init() {
		if (this.#loaded) return;
		this.#data = { ...fresh(), ...loadJSON<Persisted>(STORAGE_KEY, fresh()) };
		this.#loaded = true;
	}

	#save() {
		saveJSON(STORAGE_KEY, $state.snapshot(this.#data));
	}

	get levelId() {
		return this.#data.levelId;
	}

	setLevel(levelId: string) {
		this.#data.levelId = levelId;
		this.#save();
	}

	get dayStreak() {
		return this.#data.dayStreak;
	}

	get totalAttempts() {
		return this.#data.totalAttempts;
	}

	get totalCorrect() {
		return this.#data.totalCorrect;
	}

	get sessions(): readonly SessionSummary[] {
		return this.#data.sessions;
	}

	get byNote(): Readonly<Record<string, NoteStat>> {
		return this.#data.byNote;
	}

	statFor(id: string): NoteStat | undefined {
		return this.#data.byNote[id];
	}

	/** Record one answered note and roll it into the per-note mastery stat. */
	recordAttempt(cardId: string, correct: boolean, responseMs: number, now: number) {
		const current = this.#data.byNote[cardId] ?? emptyStat();
		this.#data.byNote[cardId] = recordAttempt(current, correct, responseMs, now);
		this.#data.totalAttempts += 1;
		if (correct) this.#data.totalCorrect += 1;
		this.#save();
	}

	/** Fold a finished round into history and update the day streak. */
	finishSession(attempts: readonly Attempt[], now: number, timezoneOffsetMinutes: number) {
		if (attempts.length === 0) return;
		const summary = summarize(attempts, now);
		this.#data.sessions = [summary, ...this.#data.sessions].slice(0, MAX_SESSIONS);
		const today = dayNumber(now, timezoneOffsetMinutes);
		this.#data.dayStreak = updateDayStreak(
			this.#data.dayStreak,
			this.#data.lastPracticedDay,
			today
		);
		this.#data.lastPracticedDay = today;
		this.#save();
	}

	resetAll() {
		this.#data = fresh();
		removeKey(STORAGE_KEY);
		this.#save();
	}
}

export const progress = new ProgressStore();
