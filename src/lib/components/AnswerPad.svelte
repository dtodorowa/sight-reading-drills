<script lang="ts">
	import { onMount } from 'svelte';
	import { LETTERS } from '$lib/music/levels';
	import type { Step } from '$lib/music/pitch';

	type Props = {
		onGuess: (step: Step) => void;
		disabled?: boolean;
		/** During the reveal, the right answer to highlight green. */
		correctStep?: Step | null;
		/** During the reveal, what the player tapped (red if it was wrong). */
		guessedStep?: Step | null;
	};

	let { onGuess, disabled = false, correctStep = null, guessedStep = null }: Props = $props();

	function press(step: Step) {
		if (disabled) return;
		onGuess(step);
	}

	function stateOf(step: Step): 'idle' | 'correct' | 'wrong' {
		if (correctStep === step) return 'correct';
		if (guessedStep === step && guessedStep !== correctStep) return 'wrong';
		return 'idle';
	}

	// Physical keyboard: a..g fire the matching letter. Handy on a laptop, ignored
	// on a phone. Reads live props, so it respects `disabled` at press time.
	onMount(() => {
		function onKey(event: KeyboardEvent) {
			if (event.repeat || event.metaKey || event.ctrlKey) return;
			const key = event.key.toUpperCase();
			if ((LETTERS as readonly string[]).includes(key)) {
				event.preventDefault();
				press(key as Step);
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<div class="grid grid-cols-4 gap-2 sm:grid-cols-7">
	{#each LETTERS as letter (letter)}
		{@const state = stateOf(letter)}
		<button
			type="button"
			onclick={() => press(letter)}
			{disabled}
			class="flex h-16 items-center justify-center rounded-lg text-2xl font-bold tabular-nums transition
				disabled:cursor-not-allowed
				{state === 'correct'
				? 'bg-green-500 text-white ring-2 ring-green-300'
				: state === 'wrong'
					? 'bg-red-500 text-white ring-2 ring-red-300'
					: 'bg-white/10 text-white hover:bg-white/20 active:bg-white/25 disabled:opacity-60'}"
			aria-label={`Note ${letter}`}
		>
			{letter}
		</button>
	{/each}
</div>
