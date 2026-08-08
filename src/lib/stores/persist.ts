// Thin, browser-guarded localStorage read/write. Kept tiny and dependency-free so
// the stores can stay focused on state, not JSON plumbing.

import { browser } from '$app/environment';

export function loadJSON<T>(key: string, fallback: T): T {
	if (!browser) return fallback;
	try {
		const raw = localStorage.getItem(key);
		if (raw === null) return fallback;
		return JSON.parse(raw) as T;
	} catch {
		// Corrupt or unreadable storage should never crash a practice session.
		return fallback;
	}
}

export function saveJSON(key: string, value: unknown): void {
	if (!browser) return;
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Private mode / quota errors: silently skip. Progress is a nice-to-have,
		// not a reason to break the drill.
	}
}

export function removeKey(key: string): void {
	if (!browser) return;
	try {
		localStorage.removeItem(key);
	} catch {
		// ignore
	}
}
