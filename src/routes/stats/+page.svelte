<script lang="ts">
	import { base } from '$app/paths';
	import { candidatesForLevel, levelById } from '$lib/music/levels';
	import { progress } from '$lib/stores/progress.svelte';
	import { notesPerMinute } from '$lib/stats/session';
	import { formatPercent, formatSeconds, formatRate } from '$lib/utils/format';
	import { streakLine } from '$lib/copy/encouragement';
	import StatChip from '$lib/components/StatChip.svelte';
	import MasteryHeatmap from '$lib/components/MasteryHeatmap.svelte';

	// The widest level covers every note the app can show, so the heatmap is a full
	// picture no matter which drill is currently selected.
	const allCards = candidatesForLevel(levelById('grand-full')!);
	const trebleCards = allCards.filter((c) => c.clef === 'treble');
	const bassCards = allCards.filter((c) => c.clef === 'bass');

	const accuracy = $derived(
		progress.totalAttempts === 0 ? 0 : progress.totalCorrect / progress.totalAttempts
	);

	const statFor = (id: string) => progress.statFor(id);

	function shortDate(timestamp: number): string {
		return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}

	function confirmReset() {
		if (confirm('Reset all progress? This clears every stat and streak.')) {
			progress.resetAll();
		}
	}
</script>

<div class="flex items-center justify-between pt-4">
	<a
		href={`${base}/`}
		class="rounded-lg bg-white/5 px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10"
	>
		back
	</a>
	<h1 class="text-lg font-black text-white">your progress</h1>
	<span class="w-14"></span>
</div>

<section class="mt-4 grid grid-cols-3 gap-2">
	<StatChip label="day streak" value={`${progress.dayStreak}`} accent />
	<StatChip label="notes read" value={`${progress.totalAttempts}`} />
	<StatChip label="accuracy" value={progress.totalAttempts === 0 ? '-' : formatPercent(accuracy)} />
</section>
<p class="mt-2 text-center text-sm text-white/50">{streakLine(progress.dayStreak)}</p>

<section class="mt-8">
	<h2 class="mb-3 text-sm font-semibold tracking-wide text-white/50 uppercase">note mastery</h2>
	<p class="mb-2 text-sm font-semibold text-white/70">Treble</p>
	<MasteryHeatmap cards={trebleCards} getStat={statFor} />
	<p class="mt-5 mb-2 text-sm font-semibold text-white/70">Bass</p>
	<MasteryHeatmap cards={bassCards} getStat={statFor} />
</section>

<section class="mt-8">
	<h2 class="mb-3 text-sm font-semibold tracking-wide text-white/50 uppercase">recent rounds</h2>
	{#if progress.sessions.length === 0}
		<p class="rounded-2xl bg-white/5 p-4 text-base text-white/50">
			No rounds yet. Your last sessions will show up here once you drill.
		</p>
	{:else}
		<div class="flex flex-col gap-2">
			{#each progress.sessions.slice(0, 10) as session (session.endedAt)}
				<div class="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
					<div>
						<p class="text-base font-bold text-white">
							{session.total} notes · {formatPercent(session.accuracy)}
						</p>
						<p class="text-sm text-white/45">{shortDate(session.endedAt)}</p>
					</div>
					<div class="text-right">
						<p class="text-base font-semibold text-white/80">
							{session.averageMs === 0 ? '-' : formatSeconds(session.averageMs)}
						</p>
						<p class="text-sm text-white/45">
							{session.averageMs === 0 ? 'speed' : `${formatRate(notesPerMinute(session))}/min`}
						</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>

<div class="mt-10">
	<button
		type="button"
		onclick={confirmReset}
		class="w-full rounded-2xl border border-red-400/30 bg-red-500/10 py-3 text-base font-semibold text-red-200 hover:bg-red-500/20"
	>
		reset all progress
	</button>
</div>
