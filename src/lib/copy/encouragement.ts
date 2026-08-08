// All the hype lives here, as data plus one pure selector, so the vibe is easy to
// tune in one place and the components stay logic-free. Keep it warm and a little
// gen-z, never corny, and never blocking: feedback should feel instant.
//
// House rule: no em dashes in any user-facing string.

export type Rng = () => number;

function pick(list: readonly string[], rng: Rng): string {
	return list[Math.floor(rng() * list.length)] ?? list[0];
}

const CORRECT = ['nice', 'yes', 'clean', 'got it', 'locked in', 'easy', 'sharp'];
const CORRECT_HOT = ['on fire', 'unreal', 'no misses', 'cooking', 'dialed in', 'goated'];
const WRONG = ['not quite', 'close', 'shake it off', 'next one', 'all good', 'we move'];

/** The little flash after each answer. streak lets us escalate the praise. */
export function reactTo(correct: boolean, streak: number, rng: Rng): string {
	if (!correct) return pick(WRONG, rng);
	if (streak >= 8) return pick(CORRECT_HOT, rng);
	return pick(CORRECT, rng);
}

/** The end-of-round headline, chosen by how it went. */
export function roundVerdict(accuracy: number, total: number): string {
	if (total === 0) return 'no notes this round, jump back in when you are ready';
	if (accuracy >= 0.95) return 'flawless run, your eyes are getting fast';
	if (accuracy >= 0.85) return 'strong round, the staff is starting to click';
	if (accuracy >= 0.65) return 'solid work, a few notes still want another look';
	return 'reps in the bank, this is exactly how reading gets fast';
}

/** Streak-flame count for the home screen, so a long run feels earned. */
export function streakLine(dayStreak: number): string {
	if (dayStreak <= 0) return 'start a streak today';
	if (dayStreak === 1) return 'day 1, the flame is lit';
	if (dayStreak < 7) return `${dayStreak} day streak, keep it alive`;
	if (dayStreak < 30) return `${dayStreak} days straight, certified regular`;
	return `${dayStreak} days, absolutely locked in`;
}

/** A nudge under the big Start button, rotated for freshness. */
const CALLS_TO_ACTION = [
	'pick a level and go',
	'two minutes is a real session',
	'read a few, beat your speed',
	'warm up those eyes'
];

export function callToAction(rng: Rng): string {
	return pick(CALLS_TO_ACTION, rng);
}
