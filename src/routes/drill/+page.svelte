<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { Drill } from '$lib/stores/drill.svelte';
	import { progress } from '$lib/stores/progress.svelte';
	import type { Step } from '$lib/music/pitch';
	import { summarize, notesPerMinute, type SessionSummary } from '$lib/stats/session';
	import { reactTo, roundVerdict } from '$lib/copy/encouragement';
	import { formatPercent, formatSeconds, formatRate } from '$lib/utils/format';
	import StaffNote from '$lib/components/StaffNote.svelte';
	import AnswerPad from '$lib/components/AnswerPad.svelte';
	import StatChip from '$lib/components/StatChip.svelte';

	const drill = new Drill();

	let reaction = $state('');
	let ended = $state(false);
	let summary = $state<SessionSummary | null>(null);
	let advanceTimer: ReturnType<typeof setTimeout> | null = null;

	const feedback = $derived(
		drill.lastCorrect === null ? null : drill.lastCorrect ? 'correct' : 'wrong'
	);

	onMount(() => {
		progress.init(); // idempotent; guarantees stats are loaded before we weight notes
		drill.start(progress.levelId, Date.now());
		return () => clearAdvance();
	});

	function clearAdvance() {
		if (advanceTimer) {
			clearTimeout(advanceTimer);
			advanceTimer = null;
		}
	}

	function handleGuess(letter: Step) {
		const correct = drill.answer(letter, Date.now());
		reaction = reactTo(correct, drill.streak, Math.random);
		clearAdvance();
		// Wrong answers linger so the correct note sinks in; right answers snap on.
		advanceTimer = setTimeout(() => drill.next(Date.now()), correct ? 600 : 1250);
	}

	function endRound() {
		clearAdvance();
		summary = summarize(drill.attempts, Date.now());
		drill.finish(Date.now());
		ended = true;
	}

	function again() {
		ended = false;
		summary = null;
		reaction = '';
		drill.start(progress.levelId, Date.now());
	}
</script>

{#if !ended}
	<div class="flex items-center justify-between pt-4">
		<button
			type="button"
			onclick={endRound}
			class="rounded-lg bg-white/5 px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10"
		>
			end round
		</button>
		<span class="text-sm font-semibold text-white/50">{drill.level?.label ?? ''}</span>
	</div>

	<div class="mt-3 grid grid-cols-3 gap-2">
		<StatChip label="streak" value={`${drill.streak}`} accent={drill.streak >= 5} />
		<StatChip label="read" value={`${drill.answered}`} />
		<StatChip label="accuracy" value={drill.answered === 0 ? '-' : formatPercent(drill.accuracy)} />
	</div>

	<div class="mt-8">
		<StaffNote card={drill.current} {feedback} />
	</div>

	<div class="flex min-h-14 items-center justify-center py-4 text-center">
		{#if drill.phase === 'revealed'}
			{#if drill.lastCorrect}
				<p class="text-2xl font-black text-green-400">{reaction}</p>
			{:else}
				<p class="text-xl font-bold text-red-300">
					{reaction}, that one was <span class="text-white">{drill.current?.pitch.step}</span>
				</p>
			{/if}
		{:else}
			<p class="text-lg font-semibold text-white/40">which note?</p>
		{/if}
	</div>

	<div class="mt-auto">
		<AnswerPad
			onGuess={handleGuess}
			disabled={drill.phase !== 'asking'}
			correctStep={drill.phase === 'revealed' ? (drill.current?.pitch.step ?? null) : null}
			guessedStep={drill.lastGuess}
		/>
		<p class="mt-3 text-center text-sm text-white/35">
			tap the letter, or use your keyboard A to G
		</p>
	</div>
{:else if summary}
	<div class="flex flex-1 flex-col justify-center py-10">
		<h1 class="text-center text-3xl font-black text-white">round done</h1>
		<p class="mt-2 text-center text-base text-white/60">
			{roundVerdict(summary.accuracy, summary.total)}
		</p>

		<div class="mt-8 grid grid-cols-2 gap-3">
			<StatChip label="notes read" value={`${summary.total}`} />
			<StatChip
				label="accuracy"
				value={summary.total === 0 ? '-' : formatPercent(summary.accuracy)}
				accent
			/>
			<StatChip label="best streak" value={`${summary.bestStreak}`} />
			<StatChip
				label="avg speed"
				value={summary.averageMs === 0 ? '-' : formatSeconds(summary.averageMs)}
			/>
		</div>
		<p class="mt-4 text-center text-sm text-white/45">
			{summary.averageMs === 0
				? 'answer a few to clock your speed'
				: `about ${formatRate(notesPerMinute(summary))} notes a minute`}
		</p>

		<div class="mt-10 flex flex-col gap-2">
			<button
				type="button"
				onclick={again}
				class="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 py-4 text-lg font-black text-white shadow-lg shadow-fuchsia-500/25 active:scale-[0.99]"
			>
				go again
			</button>
			<a
				href={`${base}/stats`}
				class="w-full rounded-2xl bg-white/5 py-3 text-center text-base font-semibold text-white/80 hover:bg-white/10"
			>
				see progress
			</a>
			<a
				href={`${base}/`}
				class="w-full py-2 text-center text-sm font-semibold text-white/50 hover:text-white/80"
			>
				change drill
			</a>
		</div>
	</div>
{/if}
