// Turning a list of answers into the numbers we show at the end of a round, plus
// the day-streak math (practice today, keep the flame). All pure.

export type Attempt = {
	cardId: string;
	correct: boolean;
	responseMs: number;
};

export type SessionSummary = {
	total: number;
	correct: number;
	accuracy: number; // 0..1
	averageMs: number; // correct answers only, 0 if none
	fastestMs: number; // 0 if none correct
	bestStreak: number;
	endedAt: number;
};

export function summarize(attempts: readonly Attempt[], endedAt: number): SessionSummary {
	let correct = 0;
	let totalCorrectMs = 0;
	let fastestMs = 0;
	let streak = 0;
	let bestStreak = 0;
	for (const attempt of attempts) {
		if (attempt.correct) {
			correct++;
			totalCorrectMs += attempt.responseMs;
			fastestMs = fastestMs === 0 ? attempt.responseMs : Math.min(fastestMs, attempt.responseMs);
			streak++;
			bestStreak = Math.max(bestStreak, streak);
		} else {
			streak = 0;
		}
	}
	return {
		total: attempts.length,
		correct,
		accuracy: attempts.length === 0 ? 0 : correct / attempts.length,
		averageMs: correct === 0 ? 0 : totalCorrectMs / correct,
		fastestMs,
		bestStreak,
		endedAt
	};
}

/** Notes answered per minute, the headline "am I reading faster" number. */
export function notesPerMinute(summary: SessionSummary): number {
	if (summary.averageMs === 0) return 0;
	return 60000 / summary.averageMs;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole-day number in local time, so "yesterday vs today" ignores clock time. */
export function dayNumber(timestamp: number, timezoneOffsetMinutes: number): number {
	return Math.floor((timestamp - timezoneOffsetMinutes * 60000) / DAY_MS);
}

/**
 * Update a running day-streak given the last day practiced. Same day -> unchanged,
 * next day -> +1, any gap -> back to 1.
 */
export function updateDayStreak(
	current: number,
	lastPracticedDay: number | null,
	todayDay: number
): number {
	if (lastPracticedDay === null) return 1;
	if (todayDay === lastPracticedDay) return Math.max(1, current);
	if (todayDay === lastPracticedDay + 1) return current + 1;
	return 1;
}
