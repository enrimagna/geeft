<script lang="ts">
	import './layout.css';
	import LivingBackground from '$lib/components/LivingBackground.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import ProfileButton from '$lib/components/ProfileButton.svelte';
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const path = $derived(page.url.pathname);
	const nav = $derived(
		path === '/give' || path.startsWith('/give/')
			? 'give'
			: path === '/receive' || path.startsWith('/receive/')
				? 'receive'
				: null
	);
	const signedIn = $derived(Boolean(data.user));
	const inSettings = $derived(path.startsWith('/settings'));
	const showBottomNav = $derived(nav !== null);
</script>

<svelte:head>
	<title>Geeft</title>
	<meta name="theme-color" content="#5C6B7A" />
	<link rel="icon" href="/favicon.png" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<link rel="manifest" href="/manifest.webmanifest" />
</svelte:head>

<LivingBackground />

{#if signedIn && data.user}
	<ProfileButton name={data.user.firstName} locale={data.locale} active={inSettings} />
{/if}

<div class="geeft-shell relative z-10">
	{#key path}
		<div in:fade={{ duration: 160 }} class="min-h-dvh {showBottomNav ? 'pb-28' : 'pb-8'}">
			{@render children()}
		</div>
	{/key}
</div>

{#if signedIn && showBottomNav}
	<BottomNav locale={data.locale} current={nav} />
{/if}
