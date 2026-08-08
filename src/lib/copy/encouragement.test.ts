import { describe, it, expect } from 'vitest';
import { reactTo, roundVerdict, streakLine, callToAction } from './encouragement';

const first = () => 0; // deterministic: always the first item

describe('reactTo', () => {
	it('escalates praise once the streak is hot', () => {
		expect(reactTo(true, 0, first)).toBe('nice');
		expect(reactTo(true, 8, first)).toBe('on fire');
	});

	it('is gentle on a miss', () => {
		expect(reactTo(false, 5, first)).toBe('not quite');
	});
});

describe('roundVerdict', () => {
	it('celebrates a flawless run', () => {
		expect(roundVerdict(1, 20)).toMatch(/flawless/);
	});

	it('stays encouraging on a rough run', () => {
		expect(roundVerdict(0.3, 20)).toMatch(/reps/);
	});

	it('handles an empty round', () => {
		expect(roundVerdict(0, 0)).toMatch(/no notes/);
	});
});

describe('streakLine', () => {
	it('handles no streak, day one, and a long run', () => {
		expect(streakLine(0)).toMatch(/start a streak/);
		expect(streakLine(1)).toMatch(/day 1/);
		expect(streakLine(42)).toMatch(/42/);
	});
});

describe('copy hygiene', () => {
	it('never uses an em dash in user-facing strings', () => {
		const samples = [
			reactTo(true, 0, first),
			reactTo(true, 9, first),
			reactTo(false, 0, first),
			roundVerdict(1, 10),
			roundVerdict(0.9, 10),
			roundVerdict(0.7, 10),
			roundVerdict(0.2, 10),
			roundVerdict(0, 0),
			streakLine(0),
			streakLine(1),
			streakLine(3),
			streakLine(12),
			streakLine(40),
			callToAction(first)
		];
		for (const s of samples) expect(s).not.toContain('—');
	});
});
