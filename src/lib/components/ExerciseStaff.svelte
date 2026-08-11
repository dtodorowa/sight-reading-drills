<script lang="ts">
	import { drawLine } from '$lib/music/render';
	import type { Exercise } from '$lib/learn/exercises';

	type Feedback = 'correct' | 'wrong' | null;

	type Props = {
		exercise: Exercise;
		/** The note to play now. Notes before it are done; after are upcoming. */
		currentIndex: number;
		/** firstTry[i] === false marks a done note that needed more than one go. */
		firstTry: boolean[];
		/** Brief right/wrong tint on the card, mirroring the single-note staff. */
		feedback?: Feedback;
	};

	let { exercise, currentIndex, firstTry, feedback = null }: Props = $props();

	let scroller = $state<HTMLDivElement | null>(null);
	let staff = $state<HTMLDivElement | null>(null);

	// Redraw when the exercise or progress changes (DOM + VexFlow, a real effect),
	// then keep the current note scrolled into view so the eyes can read ahead.
	$effect(() => {
		if (!staff) return;
		const target = staff;
		const params = { clef: exercise.clef, notes: exercise.notes, currentIndex, firstTry };
		void drawLine(target, params).then((currentX) => {
			if (currentX === null || !scroller) return;
			const left = Math.max(0, currentX - scroller.clientWidth / 2);
			scroller.scrollTo({ left, behavior: 'smooth' });
		});
	});
</script>

<div
	class="w-full rounded-2xl bg-[#fbfaf5] p-3 shadow-lg ring-4 transition-colors duration-150"
	class:ring-transparent={!feedback}
	class:ring-green-400={feedback === 'correct'}
	class:ring-red-400={feedback === 'wrong'}
>
	<div bind:this={scroller} class="w-full overflow-x-auto">
		<div bind:this={staff}></div>
	</div>
</div>
