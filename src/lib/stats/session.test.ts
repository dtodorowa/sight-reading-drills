import { describe, it, expect } from 'vitest';
import { summarize, notesPerMinute, dayNumber, updateDayStreak, type Attempt } from './session';

const a = (correct: boolean, responseMs: number): Attempt => ({ cardId: 'x', correct, responseMs });

describe('summarize', () => {
	it('is all zeros for an empty session', () => {
		const s = summarize([], 100);
		expect(s).toMatchObject({
			total: 0,
			correct: 0,
			accuracy: 0,
			averageMs: 0,
			fastestMs: 0,
			bestStreak: 0
		});
	});

	it('computes accuracy, average, fastest over correct answers only', () => {
		const s = summarize([a(true, 1000), a(false, 5000), a(true, 2000)], 999);
		expect(s.total).toBe(3);
		expect(s.correct).toBe(2);
		expect(s.accuracy).toBeCloseTo(2 / 3);
		expect(s.averageMs).toBe(1500);
		expect(s.fastestMs).toBe(1000);
		expect(s.endedAt).toBe(999);
	});

	it('finds the best streak, not just the final one', () => {
		const s = summarize([a(true, 1), a(true, 1), a(true, 1), a(false, 1), a(true, 1)], 0);
		expect(s.bestStreak).toBe(3);
	});
});

describe('notesPerMinute', () => {
	it('inverts the average response time', () => {
		expect(notesPerMinute(summarize([a(true, 1000)], 0))).toBeCloseTo(60);
		expect(notesPerMinute(summarize([], 0))).toBe(0);
	});
});

describe('dayNumber', () => {
	it('groups two times on the same local day together', () => {
		const morning = Date.UTC(2026, 7, 8, 9, 0);
		const evening = Date.UTC(2026, 7, 8, 22, 0);
		expect(dayNumber(morning, 0)).toBe(dayNumber(evening, 0));
	});

	it('separates consecutive days', () => {
		const d1 = Date.UTC(2026, 7, 8, 12, 0);
		const d2 = Date.UTC(2026, 7, 9, 12, 0);
		expect(dayNumber(d2, 0)).toBe(dayNumber(d1, 0) + 1);
	});
});

describe('updateDayStreak', () => {
	it('starts at 1 on the first ever practice', () => {
		expect(updateDayStreak(0, null, 100)).toBe(1);
	});

	it('holds steady for a second session the same day', () => {
		expect(updateDayStreak(5, 100, 100)).toBe(5);
	});

	it('increments on a consecutive day', () => {
		expect(updateDayStreak(5, 100, 101)).toBe(6);
	});

	it('resets to 1 after a missed day', () => {
		expect(updateDayStreak(5, 100, 103)).toBe(1);
	});
});
