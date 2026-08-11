<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { Etude } from '$lib/stores/etude.svelte';
	import { progress } from '$lib/stores/progress.svelte';
	import { chapterForExercise } from '$lib/learn/chapters';
	import { pitchLabel, type Pitch } from '$lib/music/pitch';
	import { formatPercent } from '$lib/utils/format';
	import ExerciseStaff from '$lib/components/ExerciseStaff.svelte';
	import PlayPad from '$lib/components/PlayPad.svelte';

	const etude = new Etude();

	let notFound = $state(false);
	let feedback = $state<'correct' | 'wrong' | null>(null);
	let flashTimer: ReturnType<typeof setTimeout> | null = null;
	let loadedId: string | null = null;

	// Load (or switch) the exercise from the ?ex query param. An $effect, not
	// onMount, so tapping "next exercise" (which only changes the query) reloads.
	$effect(() => {
		const exerciseId = $page.url.searchParams.get('ex');
		if (!exerciseId || exerciseId === loadedId) return;
		loadedId = exerciseId;
		feedback = null;
		notFound = !etude.load(exerciseId, Date.now());
	});

	const chapter = $derived(etude.exercise ? chapterForExercise(etude.exercise.id) : undefined);
	const nextId = $derived.by(() => {
		if (!etude.exercise || !chapter) return null;
		const ids = chapter.exerciseIds;
		const here = ids.indexOf(etude.exercise.id);
		return here >= 0 && here < ids.length - 1 ? ids[here + 1] : null;
	});
	const accuracy = $derived(etude.total === 0 ? 0 : etude.firstTryCorrect / etude.total);

	onMount(() => {
		progress.init();
		return () => clearFlash();
	});

	function clearFlash() {
		if (flashTimer) {
			clearTimeout(flashTimer);
			flashTimer = null;
		}
	}

	function handleNote(pitch: Pitch) {
		const result = etude.attempt(pitch, Date.now());
		if (result === 'ignored') return;
		feedback = result;
		clearFlash();
		flashTimer = setTimeout(() => (feedback = null), result === 'correct' ? 250 : 500);
	}

	function again() {
		feedback = null;
		etude.restart(Date.now());
	}
</script>

<div class="flex items-center justify-between pt-4">
	<a
		href={`${base}/learn`}
		class="rounded-lg bg-white/5 px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10"
	>
		book
	</a>
	<span class="text-sm font-semibold text-white/50">{chapter?.title ?? 'play mode'}</span>
</div>

{#if notFound}
	<div class="flex flex-1 flex-col justify-center py-16 text-center">
		<p class="text-lg font-bold text-white">that exercise is not here</p>
		<a href={`${base}/learn`} class="mt-4 text-sm font-semibold text-fuchsia-300 underline">
			back to the book
		</a>
	</div>
{:else if etude.exercise}
	<header class="pt-5 pb-1">
		<h1 class="text-2xl font-black text-white">{etude.exercise.title}</h1>
		<p class="mt-1 text-sm text-white/55">
			{etude.exercise.keyName} · read the shape, play it slow
		</p>
	</header>

	<div class="mt-4">
		<ExerciseStaff
			exercise={etude.exercise}
			currentIndex={etude.index}
			firstTry={etude.firstTry}
			{feedback}
		/>
	</div>

	{#if etude.phase === 'playing'}
		<div class="flex min-h-10 items-center justify-center py-3 text-center">
			<p class="text-sm font-semibold text-white/45">
				note {etude.index + 1} of {etude.total} · play
				<span class="text-white">{pitchLabel(etude.exercise.notes[etude.index])}</span>
			</p>
		</div>

		<div class="mt-auto">
			<PlayPad onPlayed={handleNote} active={etude.phase === 'playing'} />
			<p class="mt-3 text-center text-sm text-white/35">
				land the right note and the line moves on, wrong notes just wait for a retry
			</p>
		</div>
	{:else}
		<div class="flex flex-1 flex-col justify-center py-8">
			<h2 class="text-center text-3xl font-black text-white">line done</h2>
			<p class="mt-2 text-center text-base text-white/60">
				{etude.firstTryCorrect} of {etude.total} on the first try
			</p>
			<div class="mx-auto mt-3">
				<span class="rounded-full bg-white/10 px-4 py-1 text-sm font-bold text-fuchsia-200">
					{formatPercent(accuracy)} clean
				</span>
			</div>

			<div class="mt-10 flex flex-col gap-2">
				<button
					type="button"
					onclick={again}
					class="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 py-4 text-lg font-black text-white shadow-lg shadow-fuchsia-500/25 active:scale-[0.99]"
				>
					play it again
				</button>
				{#if nextId}
					<button
						type="button"
						onclick={() => goto(`${base}/learn/play?ex=${nextId}`)}
						class="w-full rounded-2xl bg-white/5 py-3 text-base font-semibold text-white/80 hover:bg-white/10"
					>
						next exercise
					</button>
				{/if}
				<a
					href={`${base}/learn`}
					class="w-full py-2 text-center text-sm font-semibold text-white/50 hover:text-white/80"
				>
					back to the book
				</a>
			</div>
		</div>
	{/if}
{/if}
