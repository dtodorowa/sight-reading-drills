// Per-note memory. One NoteStat per card (clef + pitch). This is what makes the
// drill adaptive: notes you miss or answer slowly carry a higher weight, so they
// come back sooner. "Slow but correct" still counts against mastery, because the
// whole mission is reading *fast*, not eventually.

export type NoteStat = {
	attempts: number;
	correct: number;
	/** Sum of response times in ms, correct answers only. */
	totalCorrectMs: number;
	/** Fastest correct answer in ms, or 0 if never correct. */
	fastestMs: number;
	/** Current run of correct answers for this note. */
	streak: number;
	/** Timestamp (ms) of the last time this note was shown. */
	lastSeen: number;
};

/** What we consider a "fast enough" correct answer, in ms. Reading, not thinking. */
export const TARGET_MS = 2000;

export function emptyStat(): NoteStat {
	return { attempts: 0, correct: 0, totalCorrectMs: 0, fastestMs: 0, streak: 0, lastSeen: 0 };
}

export function recordAttempt(
	stat: NoteStat,
	correct: boolean,
	responseMs: number,
	now: number
): NoteStat {
	const next: NoteStat = {
		...stat,
		attempts: stat.attempts + 1,
		lastSeen: now
	};
	if (!correct) {
		next.streak = 0;
		return next;
	}
	next.correct = stat.correct + 1;
	next.totalCorrectMs = stat.totalCorrectMs + responseMs;
	next.fastestMs = stat.fastestMs === 0 ? responseMs : Math.min(stat.fastestMs, responseMs);
	next.streak = stat.streak + 1;
	return next;
}

export function accuracy(stat: NoteStat): number {
	if (stat.attempts === 0) return 0;
	return stat.correct / stat.attempts;
}

/** Average correct response time in ms, or 0 if never answered correctly. */
export function averageMs(stat: NoteStat): number {
	if (stat.correct === 0) return 0;
	return stat.totalCorrectMs / stat.correct;
}

/**
 * A single 0..1 score blending "do you get it right" and "do you get it fast".
 * 0 = brand new or hopeless, 1 = instant and reliable. Used for the heatmap and
 * to decide when a note has graduated.
 */
export function masteryScore(stat: NoteStat): number {
	if (stat.attempts === 0) return 0;
	const acc = accuracy(stat);
	const avg = averageMs(stat);
	// Speed term: full marks at/under target, fading out by ~3x target.
	const speed = avg === 0 ? 0 : Math.max(0, Math.min(1, (2 * TARGET_MS - avg) / TARGET_MS));
	// Confidence: one lucky answer should not read as mastered.
	const confidence = Math.min(1, stat.attempts / 4);
	return acc * (0.55 + 0.45 * speed) * confidence;
}

export type MasteryBucket = 'new' | 'learning' | 'shaky' | 'solid' | 'mastered';

export function masteryBucket(stat: NoteStat): MasteryBucket {
	if (stat.attempts === 0) return 'new';
	const score = masteryScore(stat);
	if (score < 0.25) return 'shaky';
	if (score < 0.5) return 'learning';
	if (score < 0.8) return 'solid';
	return 'mastered';
}
