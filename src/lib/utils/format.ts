// Display formatting for stats. Pure and tiny, but tested because off-by-one
// rounding in the headline numbers is exactly the kind of thing that looks fine
// until it says "100%" on a missed note.

/** Milliseconds to a short seconds label, e.g. 820 -> "0.8s". */
export function formatSeconds(ms: number): string {
	if (ms <= 0) return '0.0s';
	return `${(ms / 1000).toFixed(1)}s`;
}

/** A 0..1 ratio to a whole-percent label, e.g. 0.833 -> "83%". */
export function formatPercent(ratio: number): string {
	return `${Math.round(ratio * 100)}%`;
}

/** Notes-per-minute to a whole number label. */
export function formatRate(notesPerMinute: number): string {
	return `${Math.round(notesPerMinute)}`;
}
