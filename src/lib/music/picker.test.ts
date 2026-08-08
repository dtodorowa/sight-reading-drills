import { describe, it, expect } from 'vitest';
import { pickNote, pushRecent, weightFor } from './picker';
import { cardId, type NoteCard } from './levels';
import { emptyStat, recordAttempt, type NoteStat } from '$lib/stats/mastery';

// A tiny seeded PRNG so the "picks struggling notes more often" test is stable.
function mulberry32(seed: number) {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const card = (step: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'): NoteCard => ({
	clef: 'treble',
	pitch: { step, octave: 4, alter: 0 }
});

const mastered = (): NoteStat => {
	let s = emptyStat();
	for (let i = 0; i < 8; i++) s = recordAttempt(s, true, 500, i);
	return s;
};

const struggling = (): NoteStat => {
	let s = emptyStat();
	for (let i = 0; i < 8; i++) s = recordAttempt(s, i % 3 === 0, 2600, i);
	return s;
};

describe('weightFor', () => {
	it('weighs a struggling note above a mastered one', () => {
		expect(weightFor(struggling(), [], 'x')).toBeGreaterThan(weightFor(mastered(), [], 'x'));
	});

	it('damps a note that was just shown', () => {
		const recent = ['treble:C4'];
		expect(weightFor(undefined, recent, 'treble:C4')).toBeLessThan(
			weightFor(undefined, [], 'treble:C4')
		);
	});
});

describe('pickNote', () => {
	it('never returns the note shown last', () => {
		const cards = [card('C'), card('D'), card('E')];
		const rng = mulberry32(42);
		let recent = ['treble:D4'];
		for (let i = 0; i < 50; i++) {
			const picked = pickNote(cards, () => emptyStat(), recent, rng);
			expect(cardId(picked)).not.toBe(recent[recent.length - 1]);
			recent = pushRecent(recent, cardId(picked), 6);
		}
	});

	it('shows a struggling note more than a mastered one over many draws', () => {
		const cards = [card('C'), card('D'), card('E'), card('F')];
		const stats: Record<string, NoteStat> = {
			'treble:C4': struggling(),
			'treble:D4': mastered(),
			'treble:E4': mastered(),
			'treble:F4': mastered()
		};
		const rng = mulberry32(7);
		const counts: Record<string, number> = {};
		let recent: string[] = [];
		for (let i = 0; i < 400; i++) {
			const picked = pickNote(cards, (id) => stats[id], recent, rng);
			const id = cardId(picked);
			counts[id] = (counts[id] ?? 0) + 1;
			recent = pushRecent(recent, id, 6);
		}
		expect(counts['treble:C4']).toBeGreaterThan(counts['treble:D4']);
	});

	it('returns the only candidate when there is one', () => {
		expect(cardId(pickNote([card('G')], () => undefined, [], mulberry32(1)))).toBe('treble:G4');
	});
});

describe('pushRecent', () => {
	it('caps the window length', () => {
		let recent: string[] = [];
		for (const id of ['a', 'b', 'c', 'd', 'e']) recent = pushRecent(recent, id, 3);
		expect(recent).toEqual(['c', 'd', 'e']);
	});
});
