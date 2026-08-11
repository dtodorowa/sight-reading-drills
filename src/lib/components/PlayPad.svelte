<script lang="ts">
	import { onMount } from 'svelte';
	import { MicPitch } from '$lib/audio/mic.svelte';
	import { pitchLabel, type Pitch } from '$lib/music/pitch';

	type Props = {
		/** Called with the note the player struck, once, while a question is open. */
		onPlayed: (pitch: Pitch) => void;
		/** True while the drill is waiting for an answer (phase === 'asking'). */
		active: boolean;
	};

	let { onPlayed, active }: Props = $props();

	const mic = new MicPitch();

	// Submit a note on a fresh strike (silence -> note) OR a move to a different
	// note (note -> note, played legato). Both are covered so this works for a
	// single answer and for playing a whole line: repeated notes come through as
	// silence between strikes, stepwise runs as note-to-note changes. A key still
	// held from the previous answer stays put (no rising edge, no change), so it
	// never leaks into the next note.
	let previousConfirmed: Pitch | null = null;

	function samePitch(a: Pitch | null, b: Pitch | null): boolean {
		return !!a && !!b && a.step === b.step && a.octave === b.octave && a.alter === b.alter;
	}

	$effect(() => {
		const played = mic.confirmed;
		const open = active;
		const previous = previousConfirmed;
		previousConfirmed = played;
		if (!open || !played) return;
		const freshStrike = previous === null;
		const movedNote = previous !== null && !samePitch(played, previous);
		if (freshStrike || movedNote) onPlayed(played);
	});

	onMount(() => () => mic.stop());
</script>

{#if mic.status === 'listening'}
	<div class="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
		<p class="text-sm font-semibold text-white/45">play the note you see</p>
		<p class="mt-1 text-4xl font-black text-white tabular-nums">
			{mic.pitch ? pitchLabel(mic.pitch) : '···'}
		</p>
		<div class="mt-2 flex items-center justify-center gap-2 text-sm text-white/45">
			<span
				class="inline-block h-2 w-2 rounded-full {mic.pitch
					? 'bg-green-400'
					: 'animate-pulse bg-fuchsia-400/70'}"
			></span>
			{mic.pitch ? 'got it' : 'listening'}
		</div>
	</div>
{:else if mic.status === 'denied'}
	<div class="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100/90">
		Mic access is blocked. Turn it back on for this site in your browser settings, then tap enable
		again.
	</div>
	<button
		type="button"
		onclick={() => mic.start()}
		class="mt-2 w-full rounded-2xl bg-white/5 py-3 text-base font-semibold text-white/80 hover:bg-white/10"
	>
		try again
	</button>
{:else if mic.status === 'unsupported'}
	<div class="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
		This browser cannot open the mic. Try Chrome or Safari, or switch back to tap mode.
	</div>
{:else if mic.status === 'error'}
	<div class="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100/90">
		Something went sideways: {mic.errorMessage ?? 'unknown error'}
	</div>
{:else}
	<button
		type="button"
		onclick={() => mic.start()}
		disabled={mic.status === 'requesting'}
		class="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 py-4 text-lg font-black text-white shadow-lg shadow-fuchsia-500/25 transition active:scale-[0.99] disabled:opacity-60"
	>
		{mic.status === 'requesting' ? 'asking for mic...' : 'enable mic to play'}
	</button>
{/if}
