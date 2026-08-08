// Chooses the next note to show. Pure: you hand it the candidate notes, the
// mastery stats, the recent history, and a random source. It hands back one card.
//
// The weighting encodes the teach philosophy:
//  - struggling notes (low accuracy, slow) get more airtime  -> desirable difficulty
//  - just-shown notes are damped down                        -> spacing, no drilling one note
//  - unseen notes get a gentle boost so they get introduced  -> coverage
// Because it never repeats the exact last card, practice stays interleaved.

import { averageMs, accuracy, masteryScore, type NoteStat } from '$lib/stats/mastery';
import { TARGET_MS } from '$lib/stats/mastery';
import { cardId, type NoteCard } from './levels';

export type StatLookup = (id: string) => NoteStat | undefined;

/** Random source in [0, 1). Injected so tests are deterministic. */
export type Rng = () => number;

export function weightFor(
	stat: NoteStat | undefined,
	recentIds: readonly string[],
	id: string
): number {
	// Unseen notes: worth showing, but not so heavy they crowd everything out.
	if (!stat || stat.attempts === 0) {
		return dampRecent(2.2, recentIds, id);
	}
	const errorTerm = 1 - accuracy(stat); // 0 (perfect) .. 1 (always wrong)
	const avg = averageMs(stat);
	const slowTerm = avg === 0 ? 1 : Math.max(0, Math.min(1.5, (avg - TARGET_MS) / TARGET_MS));
	const masteredRelief = 0.35 * masteryScore(stat); // pull mastered notes down
	const base = 0.5 + 3 * errorTerm + 1.5 * slowTerm - masteredRelief;
	return dampRecent(Math.max(0.1, base), recentIds, id);
}

// The more recently (and often) a note appeared in the window, the harder we damp it.
function dampRecent(weight: number, recentIds: readonly string[], id: string): number {
	const index = recentIds.lastIndexOf(id);
	if (index === -1) return weight;
	// index near the end (just shown) -> strongest damping.
	const closeness = (index + 1) / recentIds.length; // (0, 1]
	const factor = 1 - 0.9 * closeness;
	return weight * factor;
}

/**
 * Pick one card by weighted random choice. Guarantees it never returns the exact
 * card that was shown last (when more than one candidate exists), so no note ever
 * appears twice in a row.
 */
export function pickNote(
	candidates: readonly NoteCard[],
	getStat: StatLookup,
	recentIds: readonly string[],
	rng: Rng
): NoteCard {
	if (candidates.length === 0) throw new Error('pickNote: no candidates');
	if (candidates.length === 1) return candidates[0];

	const lastId = recentIds[recentIds.length - 1];
	const pool = candidates.filter((card) => cardId(card) !== lastId);
	const usable = pool.length > 0 ? pool : candidates;

	const weights = usable.map((card) => weightFor(getStat(cardId(card)), recentIds, cardId(card)));
	const total = weights.reduce((sum, w) => sum + w, 0);

	let roll = rng() * total;
	for (let i = 0; i < usable.length; i++) {
		roll -= weights[i];
		if (roll < 0) return usable[i];
	}
	return usable[usable.length - 1]; // float-rounding fallback
}

/** Keeps the recent-history window a fixed length. */
export function pushRecent(recentIds: readonly string[], id: string, windowSize: number): string[] {
	const next = [...recentIds, id];
	return next.length > windowSize ? next.slice(next.length - windowSize) : next;
}
