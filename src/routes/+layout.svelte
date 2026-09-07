<script lang="ts">
	import './layout.css';
	import LivingBackground from '$lib/components/LivingBackground.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import ProfileButton from '$lib/components/ProfileButton.svelte';
	import { page } from '$app/state';
	import { fly } from 'svelte/transition';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const path = $derived(page.url.pathname);
	const nav = $derived(
		path.startsWith('/give') ? 'give' : path.startsWith('/receive') ? 'receive' : null
	);
	const signedIn = $derived(Boolean(data.user));
	const inSettings = $derived(path.startsWith('/settings'));
</script>

<svelte:head>
	<title>Geeft</title>
	<meta name="theme-color" content="#5C6B7A" />
	<link rel="icon" href="/favicon.png" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<link rel="manifest" href="/manifest.webmanifest" />
</svelte:head>

<LivingBackground />

<div class="geeft-shell relative z-10">
	{#if signedIn && data.user}
		<ProfileButton name={data.user.firstName} locale={data.locale} active={inSettings} />
	{/if}
	{#key path}
		<div in:fly={{ y: 18, duration: 380 }} class="min-h-dvh pb-28">
			{@render children()}
		</div>
	{/key}
	{#if signedIn}
		<BottomNav locale={data.locale} current={nav} />
	{/if}
</div>
