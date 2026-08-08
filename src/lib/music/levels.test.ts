import { describe, it, expect } from 'vitest';
import { candidatesForLevel, cardId, levelById, LEVELS, type Level } from './levels';

describe('candidatesForLevel', () => {
	it('enumerates every natural note in the range, inclusive', () => {
		const trebleStaff = levelById('treble-staff') as Level;
		const cards = candidatesForLevel(trebleStaff);
		// E4 F4 G4 A4 B4 C5 D5 E5 F5 = 9 notes
		expect(cards).toHaveLength(9);
		expect(cardId(cards[0])).toBe('treble:E4');
		expect(cardId(cards[cards.length - 1])).toBe('treble:F5');
	});

	it('combines segments for grand-staff levels', () => {
		const grand = levelById('grand-staff') as Level;
		const cards = candidatesForLevel(grand);
		expect(cards.some((c) => c.clef === 'treble')).toBe(true);
		expect(cards.some((c) => c.clef === 'bass')).toBe(true);
	});

	it('never produces accidentals (naturals only)', () => {
		for (const level of LEVELS) {
			for (const card of candidatesForLevel(level)) {
				expect(card.pitch.alter).toBe(0);
			}
		}
	});

	it('gives every level a unique id', () => {
		const ids = LEVELS.map((l) => l.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});

describe('cardId', () => {
	it('separates the same pitch across clefs', () => {
		const trebleC4 = {
			clef: 'treble' as const,
			pitch: { step: 'C' as const, octave: 4, alter: 0 as const }
		};
		const bassC4 = {
			clef: 'bass' as const,
			pitch: { step: 'C' as const, octave: 4, alter: 0 as const }
		};
		expect(cardId(trebleC4)).not.toBe(cardId(bassC4));
	});
});
