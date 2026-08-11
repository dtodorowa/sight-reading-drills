import { describe, it, expect } from 'vitest';
import {
	diatonicIndex,
	pitchFromDiatonic,
	midi,
	pitchFromMidi,
	playedMatches,
	toVexKey,
	pitchId,
	pitchLabel,
	type Pitch
} from './pitch';

const p = (step: Pitch['step'], octave: number, alter: Pitch['alter'] = 0): Pitch => ({
	step,
	octave,
	alter
});

describe('diatonicIndex', () => {
	it('orders notes as they climb the staff', () => {
		expect(diatonicIndex(p('C', 4))).toBeLessThan(diatonicIndex(p('D', 4)));
		expect(diatonicIndex(p('B', 4))).toBeLessThan(diatonicIndex(p('C', 5)));
	});

	it('ignores the accidental (same staff line for F, F#, Fb)', () => {
		expect(diatonicIndex(p('F', 5, 1))).toBe(diatonicIndex(p('F', 5, 0)));
		expect(diatonicIndex(p('F', 5, -1))).toBe(diatonicIndex(p('F', 5, 0)));
	});

	it('round-trips through pitchFromDiatonic for naturals', () => {
		for (const octave of [2, 3, 4, 5]) {
			for (const step of ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const) {
				const pitch = p(step, octave);
				expect(pitchFromDiatonic(diatonicIndex(pitch))).toEqual(pitch);
			}
		}
	});
});

describe('midi', () => {
	it('anchors middle C to 60', () => {
		expect(midi(p('C', 4))).toBe(60);
	});

	it('handles sharps and flats', () => {
		expect(midi(p('A', 4))).toBe(69); // concert A
		expect(midi(p('F', 4, 1))).toBe(66);
		expect(midi(p('G', 4, -1))).toBe(66); // enharmonic with F#4
	});
});

describe('pitchFromMidi', () => {
	it('anchors 60 to middle C', () => {
		expect(pitchFromMidi(60)).toEqual(p('C', 4));
	});

	it('spells black keys as sharps', () => {
		expect(pitchFromMidi(61)).toEqual(p('C', 4, 1));
		expect(pitchFromMidi(70)).toEqual(p('A', 4, 1));
	});

	it('rounds a fractional (detected) number to the nearest semitone', () => {
		expect(pitchFromMidi(69.3)).toEqual(p('A', 4));
		expect(pitchFromMidi(68.7)).toEqual(p('A', 4));
	});

	it('round-trips every natural note back through midi()', () => {
		for (let octave = 1; octave <= 6; octave++) {
			for (const step of ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const) {
				const pitch = p(step, octave);
				expect(midi(pitchFromMidi(midi(pitch)))).toBe(midi(pitch));
			}
		}
	});
});

describe('playedMatches', () => {
	it('exact mode wants the same pitch and octave', () => {
		expect(playedMatches(p('C', 4), p('C', 4), false)).toBe(true);
		expect(playedMatches(p('C', 4), p('C', 5), false)).toBe(false);
		expect(playedMatches(p('C', 4), p('D', 4), false)).toBe(false);
	});

	it('exact mode treats enharmonics as the same key', () => {
		// F#4 and Gb4 are the same piano key, so playing either answers the other.
		expect(playedMatches(p('F', 4, 1), p('G', 4, -1), false)).toBe(true);
	});

	it('any-octave mode accepts the right note in a different octave', () => {
		expect(playedMatches(p('C', 4), p('C', 5), true)).toBe(true);
		expect(playedMatches(p('C', 4), p('C', 2), true)).toBe(true);
		expect(playedMatches(p('C', 4), p('C', 4, 1), true)).toBe(false); // C# is a different note
		expect(playedMatches(p('C', 4), p('B', 3), true)).toBe(false);
	});
});

describe('formatting', () => {
	it('builds VexFlow keys', () => {
		expect(toVexKey(p('C', 4))).toBe('c/4');
		expect(toVexKey(p('F', 5, 1))).toBe('f#/5');
		expect(toVexKey(p('B', 3, -1))).toBe('bb/3');
	});

	it('builds stable ids and pretty labels', () => {
		expect(pitchId(p('F', 5, 1))).toBe('F#5');
		expect(pitchLabel(p('F', 5, 1))).toBe('F♯5');
		expect(pitchLabel(p('B', 3, -1))).toBe('B♭3');
	});
});
