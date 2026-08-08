import { describe, it, expect } from 'vitest';
import {
	emptyStat,
	recordAttempt,
	accuracy,
	averageMs,
	masteryScore,
	masteryBucket,
	TARGET_MS,
	type NoteStat
} from './mastery';

const fast = (stat: NoteStat, correct: boolean, ms = 800, now = 1) =>
	recordAttempt(stat, correct, ms, now);

describe('recordAttempt', () => {
	it('counts a correct answer and its timing', () => {
		const s = recordAttempt(emptyStat(), true, 900, 1000);
		expect(s.attempts).toBe(1);
		expect(s.correct).toBe(1);
		expect(s.totalCorrectMs).toBe(900);
		expect(s.fastestMs).toBe(900);
		expect(s.streak).toBe(1);
		expect(s.lastSeen).toBe(1000);
	});

	it('resets the streak on a miss but still records the attempt', () => {
		let s = fast(emptyStat(), true);
		s = fast(s, true);
		expect(s.streak).toBe(2);
		s = recordAttempt(s, false, 3000, 5);
		expect(s.streak).toBe(0);
		expect(s.attempts).toBe(3);
		expect(s.correct).toBe(2); // a miss does not add to correct
	});

	it('tracks the fastest correct answer', () => {
		let s = fast(emptyStat(), true, 1200);
		s = fast(s, true, 700);
		s = fast(s, true, 1500);
		expect(s.fastestMs).toBe(700);
	});

	it('does not mutate its input', () => {
		const before = emptyStat();
		const snapshot = { ...before };
		recordAttempt(before, true, 500, 1);
		expect(before).toEqual(snapshot);
	});
});

describe('accuracy and averageMs', () => {
	it('are zero for an unseen note', () => {
		expect(accuracy(emptyStat())).toBe(0);
		expect(averageMs(emptyStat())).toBe(0);
	});

	it('average uses correct answers only', () => {
		let s = fast(emptyStat(), true, 1000);
		s = recordAttempt(s, false, 9999, 2); // ignored by average
		s = fast(s, true, 2000);
		expect(averageMs(s)).toBe(1500);
	});
});

describe('masteryScore / bucket', () => {
	it('is 0 and "new" before any attempt', () => {
		expect(masteryScore(emptyStat())).toBe(0);
		expect(masteryBucket(emptyStat())).toBe('new');
	});

	it('rewards fast + accurate over slow + accurate', () => {
		let quick = emptyStat();
		let slow = emptyStat();
		for (let i = 0; i < 6; i++) {
			quick = recordAttempt(quick, true, 600, i);
			slow = recordAttempt(slow, true, TARGET_MS * 2.5, i);
		}
		expect(masteryScore(quick)).toBeGreaterThan(masteryScore(slow));
	});

	it('reaches "mastered" with repeated fast correct answers', () => {
		let s = emptyStat();
		for (let i = 0; i < 8; i++) s = recordAttempt(s, true, 500, i);
		expect(masteryBucket(s)).toBe('mastered');
	});

	it('stays low while accuracy is poor', () => {
		let s = emptyStat();
		for (let i = 0; i < 8; i++) s = recordAttempt(s, i % 4 === 0, 800, i);
		expect(masteryScore(s)).toBeLessThan(0.5);
	});
});
