<script lang="ts">
	import { drawNote } from '$lib/music/render';
	import type { NoteCard } from '$lib/music/levels';

	type Feedback = 'correct' | 'wrong' | null;

	type Props = {
		card: NoteCard | null;
		feedback?: Feedback;
	};

	let { card, feedback = null }: Props = $props();

	let container = $state<HTMLDivElement | null>(null);

	const INK = '#181826';
	const GREEN = '#16a34a';
	const RED = '#dc2626';

	function colorFor(state: Feedback): string {
		if (state === 'correct') return GREEN;
		if (state === 'wrong') return RED;
		return INK;
	}

	// Redraw whenever the note or the feedback tint changes. Drawing touches the DOM
	// and a third-party lib, so it genuinely belongs in an effect.
	$effect(() => {
		if (!container || !card) return;
		void drawNote(container, card, { color: colorFor(feedback) });
	});
</script>

<div
	class="mx-auto w-full max-w-sm rounded-2xl bg-[#fbfaf5] p-4 shadow-lg ring-4 transition-colors duration-150"
	class:ring-transparent={!feedback}
	class:ring-green-400={feedback === 'correct'}
	class:ring-red-400={feedback === 'wrong'}
>
	{#if card}
		<div bind:this={container} class="w-full"></div>
	{:else}
		<div class="flex h-40 items-center justify-center text-base text-neutral-400">
			loading staff
		</div>
	{/if}
</div>
