<script lang="ts">
	import { cardId, type NoteCard } from '$lib/music/levels';
	import { pitchLabel } from '$lib/music/pitch';
	import { masteryBucket, type NoteStat, type MasteryBucket } from '$lib/stats/mastery';

	type Props = {
		cards: NoteCard[];
		getStat: (id: string) => NoteStat | undefined;
	};

	let { cards, getStat }: Props = $props();

	const CELL: Record<MasteryBucket, string> = {
		new: 'bg-white/5 text-white/40 ring-white/10',
		shaky: 'bg-red-500/25 text-red-100 ring-red-400/40',
		learning: 'bg-amber-500/25 text-amber-100 ring-amber-400/40',
		solid: 'bg-lime-500/25 text-lime-100 ring-lime-400/40',
		mastered: 'bg-emerald-500/40 text-emerald-50 ring-emerald-300/50'
	};

	function bucketFor(card: NoteCard): MasteryBucket {
		const stat = getStat(cardId(card));
		return stat ? masteryBucket(stat) : 'new';
	}
</script>

<div class="flex flex-wrap gap-2">
	{#each cards as card (cardId(card))}
		<div
			class="flex h-11 w-12 flex-col items-center justify-center rounded-lg text-sm font-semibold ring-1 {CELL[
				bucketFor(card)
			]}"
			title={cardId(card)}
		>
			{pitchLabel(card.pitch)}
		</div>
	{/each}
</div>

<div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/50">
	<span class="flex items-center gap-1"
		><span class="h-3 w-3 rounded-[3px] bg-white/15"></span> new</span
	>
	<span class="flex items-center gap-1"
		><span class="h-3 w-3 rounded-[3px] bg-red-500/40"></span> shaky</span
	>
	<span class="flex items-center gap-1"
		><span class="h-3 w-3 rounded-[3px] bg-amber-500/40"></span> learning</span
	>
	<span class="flex items-center gap-1"
		><span class="h-3 w-3 rounded-[3px] bg-lime-500/40"></span> solid</span
	>
	<span class="flex items-center gap-1"
		><span class="h-3 w-3 rounded-[3px] bg-emerald-500/60"></span> mastered</span
	>
</div>
