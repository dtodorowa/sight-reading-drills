<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { LEVELS } from '$lib/music/levels';
	import { progress } from '$lib/stores/progress.svelte';
	import { streakLine, callToAction } from '$lib/copy/encouragement';
	import { formatPercent } from '$lib/utils/format';
	import StatChip from '$lib/components/StatChip.svelte';

	// Rolled once after mount so the server and client agree on first paint.
	let cta = $state('pick a level and go');
	onMount(() => {
		cta = callToAction(Math.random);
	});

	const accuracy = $derived(
		progress.totalAttempts === 0 ? 0 : progress.totalCorrect / progress.totalAttempts
	);
	const playMode = $derived(progress.inputMode === 'play');

	function startDrill() {
		goto(`${base}/drill`);
	}
</script>

<header class="pt-6 pb-4">
	<p class="text-sm font-semibold tracking-widest text-fuchsia-300/80 uppercase">NoteDash</p>
	<h1 class="mt-1 text-4xl font-black text-white">read music,<br />fast.</h1>
	<p class="mt-2 text-base text-white/60">
		Adaptive sight-reading drills. The notes you fumble come back more often, so your eyes get quick
		where it counts.
	</p>
</header>

<section class="grid grid-cols-3 gap-2 py-2">
	<StatChip label="day streak" value={`${progress.dayStreak}`} accent />
	<StatChip label="notes read" value={`${progress.totalAttempts}`} />
	<StatChip label="accuracy" value={progress.totalAttempts === 0 ? '-' : formatPercent(accuracy)} />
</section>
<p class="pb-2 text-center text-sm text-white/50">{streakLine(progress.dayStreak)}</p>

<a
	href={`${base}/learn`}
	class="mt-3 block rounded-2xl border border-fuchsia-400/30 bg-fuchsia-500/10 p-4 transition hover:bg-fuchsia-500/15"
>
	<div class="flex items-center justify-between">
		<span class="text-base font-black text-white">Learn to read, on your piano</span>
		<span class="text-fuchsia-300">→</span>
	</div>
	<p class="mt-1 text-sm text-white/60">
		A progression book: short lessons, then real lines you play and the app checks. Start at chapter
		1.
	</p>
</a>

<section class="mt-4">
	<h2 class="mb-2 text-sm font-semibold tracking-wide text-white/50 uppercase">how you answer</h2>
	<div class="grid grid-cols-2 gap-1 rounded-lg bg-white/5 p-1">
		<button
			type="button"
			onclick={() => progress.setInputMode('tap')}
			aria-pressed={!playMode}
			class="rounded-lg py-2 text-sm font-bold transition {!playMode
				? 'bg-white/15 text-white'
				: 'text-white/55 hover:text-white/80'}"
		>
			tap letters
		</button>
		<button
			type="button"
			onclick={() => progress.setInputMode('play')}
			aria-pressed={playMode}
			class="rounded-lg py-2 text-sm font-bold transition {playMode
				? 'bg-fuchsia-500/25 text-white ring-1 ring-fuchsia-400/40'
				: 'text-white/55 hover:text-white/80'}"
		>
			play piano
		</button>
	</div>
	{#if playMode}
		<label
			class="mt-2 flex cursor-pointer items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm text-white/70"
		>
			<span>accept any octave</span>
			<input
				type="checkbox"
				checked={progress.octaveForgiving}
				onchange={(event) => progress.setOctaveForgiving(event.currentTarget.checked)}
				class="h-4 w-4 accent-fuchsia-500"
			/>
		</label>
		<p class="mt-1 text-sm text-white/40">
			Off reads the exact note on the staff, octave and all. On accepts the right note in any
			octave.
		</p>
	{/if}
</section>

<section class="mt-4">
	<h2 class="mb-2 text-sm font-semibold tracking-wide text-white/50 uppercase">
		choose your drill
	</h2>
	<div class="flex flex-col gap-2">
		{#each LEVELS as level (level.id)}
			{@const selected = progress.levelId === level.id}
			<button
				type="button"
				onclick={() => progress.setLevel(level.id)}
				class="rounded-2xl border p-4 text-left transition {selected
					? 'border-fuchsia-400/60 bg-fuchsia-500/15 ring-1 ring-fuchsia-400/40'
					: 'border-white/10 bg-white/5 hover:bg-white/10'}"
				aria-pressed={selected}
			>
				<div class="flex items-center justify-between">
					<span class="text-base font-bold text-white">{level.label}</span>
					{#if selected}
						<span class="rounded-full bg-fuchsia-400/20 px-2 py-0.5 text-sm text-fuchsia-200"
							>picked</span
						>
					{/if}
				</div>
				<p class="mt-1 text-sm text-white/55">{level.blurb}</p>
			</button>
		{/each}
	</div>
</section>

<div class="sticky bottom-4 mt-6 pt-2">
	<button
		type="button"
		onclick={startDrill}
		class="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 py-4 text-lg font-black text-white shadow-lg shadow-fuchsia-500/25 transition active:scale-[0.99]"
	>
		start drilling
	</button>
	<p class="mt-2 text-center text-sm text-white/45">{cta}</p>
	<a
		href={`${base}/stats`}
		class="mt-3 block text-center text-sm font-semibold text-white/60 underline-offset-4 hover:underline"
	>
		see your progress
	</a>
	<a
		href={`${base}/play`}
		class="mt-2 block text-center text-sm font-semibold text-fuchsia-300/80 underline-offset-4 hover:underline"
	>
		mic check: is the app hearing your piano? (beta)
	</a>
</div>
