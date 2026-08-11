<script lang="ts">
	import { base } from '$app/paths';
	import { CHAPTERS } from '$lib/learn/chapters';
	import { exerciseById } from '$lib/learn/exercises';

	// The progression book. Chapters teach a little, then hand you lines to read
	// and play on your instrument. Composition root: it just lays out the content.
	const chapters = CHAPTERS;
</script>

<div class="flex items-center justify-between pt-4">
	<a
		href={`${base}/`}
		class="rounded-lg bg-white/5 px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10"
	>
		back
	</a>
	<span class="text-sm font-semibold text-white/50">learn to read</span>
</div>

<header class="pt-6 pb-4">
	<p class="text-sm font-semibold tracking-widest text-fuchsia-300/80 uppercase">Progression</p>
	<h1 class="mt-1 text-3xl font-black text-white">read it, then play it</h1>
	<p class="mt-2 text-base text-white/60">
		Short lessons, then real lines to play on your piano. The app listens and moves you to the next
		note when you land the right one. Work top to bottom, or jump to what you need.
	</p>
</header>

<div class="flex flex-col gap-4 pb-8">
	{#each chapters as chapter (chapter.id)}
		<section class="rounded-2xl border border-white/10 bg-white/5 p-4">
			<div class="flex items-baseline gap-2">
				<span class="text-sm font-black text-fuchsia-300/80">{chapter.number}</span>
				<h2 class="text-lg font-black text-white">{chapter.title}</h2>
			</div>
			<p class="mt-1 text-sm text-white/60">{chapter.intro}</p>

			<div class="mt-3 flex flex-col gap-2">
				{#each chapter.exerciseIds as exerciseId (exerciseId)}
					{@const exercise = exerciseById(exerciseId)}
					{#if exercise}
						<a
							href={`${base}/learn/play?ex=${exercise.id}`}
							class="flex items-center justify-between rounded-lg bg-white/5 px-3 py-3 hover:bg-white/10"
						>
							<span class="text-base font-semibold text-white">{exercise.title}</span>
							<span class="ml-3 shrink-0 text-sm text-white/45">
								{exercise.keyName} · {exercise.clef} · {exercise.notes.length}
							</span>
						</a>
					{/if}
				{/each}
			</div>
		</section>
	{/each}
</div>
