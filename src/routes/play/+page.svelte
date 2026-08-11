<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { MicPitch } from '$lib/audio/mic.svelte';
	import { pitchLabel } from '$lib/music/pitch';

	// This screen is the first step of Play Mode: prove the app can hear your
	// piano. It is a live mic check / tuner. Scoring against the note on the staff
	// comes next (issue #3), on top of this same MicPitch source.
	const mic = new MicPitch();

	// The tuning needle: map -50..+50 cents onto 0..100% of the track.
	const needleLeft = $derived(`${Math.min(100, Math.max(0, mic.cents + 50))}%`);
	const inTune = $derived(mic.pitch !== null && Math.abs(mic.cents) <= 8);

	onMount(() => {
		// Never keep the mic open once the user leaves the screen.
		return () => mic.stop();
	});
</script>

<div class="flex items-center justify-between pt-4">
	<a
		href={`${base}/`}
		class="rounded-lg bg-white/5 px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10"
	>
		back
	</a>
	<span class="text-sm font-semibold text-white/50">play mode (beta)</span>
</div>

<header class="pt-6 pb-2">
	<h1 class="text-3xl font-black text-white">hear your piano</h1>
	<p class="mt-2 text-base text-white/60">
		Point your mic at the piano and play a single note. The app tells you what it hears. Audio never
		leaves your device.
	</p>
</header>

{#if mic.status === 'listening'}
	<section class="mt-6 flex flex-1 flex-col">
		<div
			class="rounded-2xl border p-6 text-center transition-colors duration-150 {inTune
				? 'border-green-400/60 bg-green-500/10'
				: 'border-white/10 bg-white/5'}"
		>
			{#if mic.pitch}
				<p class="text-7xl font-black tracking-tight text-white">{pitchLabel(mic.pitch)}</p>
				<p class="mt-2 text-base text-white/55">
					{mic.hz?.toFixed(1)} Hz
					<span class="text-white/30">·</span>
					{mic.cents > 0 ? '+' : ''}{mic.cents} cents
				</p>

				<!-- Tuning meter: needle sits center when the note is dead on. -->
				<div class="relative mx-auto mt-5 h-3 w-full max-w-xs rounded-full bg-white/10">
					<div class="absolute top-0 left-1/2 h-3 w-px -translate-x-1/2 bg-white/40"></div>
					<div
						class="absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[left] duration-75 {inTune
							? 'bg-green-400'
							: 'bg-fuchsia-400'}"
						style:left={needleLeft}
					></div>
				</div>
				<p class="mt-3 text-sm font-semibold {inTune ? 'text-green-300' : 'text-white/40'}">
					{inTune ? 'right on' : mic.cents > 0 ? 'a touch sharp' : 'a touch flat'}
				</p>
			{:else}
				<p class="text-2xl font-bold text-white/40">play a note</p>
				<p class="mt-2 text-sm text-white/35">one key at a time works best</p>
			{/if}
		</div>

		<div class="mt-4 flex items-center justify-center gap-2 text-sm text-white/45">
			<span class="inline-block h-2 w-2 rounded-full {mic.pitch ? 'bg-green-400' : 'bg-white/20'}"
			></span>
			{mic.confirmed ? `locked on ${pitchLabel(mic.confirmed)}` : 'listening'}
		</div>

		<div class="mt-auto pt-8">
			<button
				type="button"
				onclick={() => mic.stop()}
				class="w-full rounded-2xl bg-white/5 py-3 text-base font-semibold text-white/80 hover:bg-white/10"
			>
				stop listening
			</button>
		</div>
	</section>
{:else}
	<section class="mt-6 flex flex-1 flex-col">
		{#if mic.status === 'denied'}
			<div class="rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-base text-red-100/90">
				Mic access is blocked. Flip it back on for this site in your browser settings, then tap
				enable again.
			</div>
		{:else if mic.status === 'unsupported'}
			<div class="rounded-2xl border border-white/10 bg-white/5 p-5 text-base text-white/70">
				This browser cannot open the mic. Try Chrome or Safari, or come back on your phone.
			</div>
		{:else if mic.status === 'error'}
			<div class="rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-base text-red-100/90">
				Something went sideways: {mic.errorMessage ?? 'unknown error'}
			</div>
		{/if}

		<div class="mt-auto pt-8">
			<button
				type="button"
				onclick={() => mic.start()}
				disabled={mic.status === 'requesting'}
				class="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 py-4 text-lg font-black text-white shadow-lg shadow-fuchsia-500/25 transition active:scale-[0.99] disabled:opacity-60"
			>
				{mic.status === 'requesting' ? 'asking for mic...' : 'enable mic'}
			</button>
			<p class="mt-2 text-center text-sm text-white/45">
				we ask your browser for the mic, nothing is recorded or uploaded
			</p>
		</div>
	</section>
{/if}
