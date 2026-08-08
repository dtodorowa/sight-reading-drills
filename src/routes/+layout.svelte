<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { progress } from '$lib/stores/progress.svelte';

	let { children } = $props();

	// Read localStorage only after mount, so the prerendered HTML and the first
	// client render match before the real numbers load in.
	onMount(() => {
		progress.init();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>NoteDash</title>
	<meta
		name="description"
		content="Fast, adaptive sight-reading drills for piano. Learn to read music at a glance."
	/>
	<meta name="theme-color" content="#15121f" />
	<link rel="manifest" href="/manifest.webmanifest" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
	<meta name="apple-mobile-web-app-title" content="NoteDash" />
</svelte:head>

<div
	class="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8"
>
	{@render children()}
</div>
