<script lang="ts">
	type Props = {
		label: string;
		value: string;
		accent?: boolean;
	};

	let { label, value, accent = false }: Props = $props();
</script>

<div
	class="flex flex-col items-center rounded-2xl px-3 py-2 {accent
		? 'bg-gradient-to-br from-fuchsia-500/20 to-indigo-500/20 ring-1 ring-fuchsia-400/30'
		: 'bg-white/5 ring-1 ring-white/10'}"
>
	<span class="text-2xl font-bold text-white tabular-nums">{value}</span>
	<span class="text-sm text-white/60">{label}</span>
</div>
