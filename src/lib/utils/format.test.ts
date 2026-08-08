import { describe, it, expect } from 'vitest';
import { formatSeconds, formatPercent, formatRate } from './format';

describe('formatSeconds', () => {
	it('shows one decimal of seconds', () => {
		expect(formatSeconds(820)).toBe('0.8s');
		expect(formatSeconds(2000)).toBe('2.0s');
	});

	it('floors non-positive input to 0.0s', () => {
		expect(formatSeconds(0)).toBe('0.0s');
		expect(formatSeconds(-5)).toBe('0.0s');
	});
});

describe('formatPercent', () => {
	it('rounds to whole percents', () => {
		expect(formatPercent(0.833)).toBe('83%');
		expect(formatPercent(1)).toBe('100%');
		expect(formatPercent(0)).toBe('0%');
	});
});

describe('formatRate', () => {
	it('rounds notes per minute', () => {
		expect(formatRate(59.6)).toBe('60');
	});
});
