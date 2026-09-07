<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Composer from '$lib/components/Composer.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import GiftCard from '$lib/components/GiftCard.svelte';
	import { t } from '$lib/i18n/catalog';
	import { fade, fly } from 'svelte/transition';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const gifts = $derived(data.gifts);
	let composer = $state(false);
	let openId = $state<string | null>(null);
	const open = $derived(gifts.find((g) => g.id === openId) ?? null);
</script>

<header class="px-5 pt-16 pr-16">
	<h1 class="font-display text-3xl font-semibold">{t(data.locale, 'app.receive')}</h1>
	<p class="mt-1 text-sm text-slate">{t(data.locale, 'app.tagline')}</p>
</header>

{#if data.lists.length > 1}
	<div class="mt-4 flex flex-wrap gap-2 px-4">
		{#each data.lists as list (list.listId)}
			<a
				href={resolve(`/receive?list=${list.listId}`)}
				class="pressable inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-sm font-semibold
					{data.selected === list.listId
					? 'bg-secondary text-secondary-content shadow-sm'
					: 'bg-white/80 text-slate'}">{list.name}</a
			>
		{/each}
	</div>
{/if}

<section class="mt-6 space-y-3 px-4">
	{#if gifts.length === 0}
		<EmptyState title={t(data.locale, 'empty.receive')} />
	{/if}
	{#each gifts as gift, i (gift.id)}
		<GiftCard
			{gift}
			index={i}
			locale={data.locale}
			mode="receive"
			onclick={() => (openId = gift.id)}
		/>
	{/each}
</section>

<button
	class="fab-box pressable btn fixed right-5 bottom-24 z-20 h-16 w-16 rounded-3xl text-3xl shadow-xl btn-secondary"
	onclick={() => (composer = true)}
	aria-label={t(data.locale, 'gift.add')}>+</button
>

<Composer
	open={composer}
	locale={data.locale}
	action="?/create"
	hidden={data.selected ? { listId: data.selected } : {}}
	onclose={() => (composer = false)}
/>

{#if open}
	<div class="fixed inset-0 z-40 flex items-end">
		<button
			class="absolute inset-0 bg-ink/35"
			onclick={() => (openId = null)}
			transition:fade={{ duration: 160 }}
			aria-label={t(data.locale, 'action.close')}
		></button>
		<div
			class="relative w-full rounded-t-[2rem] bg-paper p-5 pb-10 shadow-2xl"
			transition:fly={{ y: 70, duration: 280 }}
		>
			<div class="ribbon mb-4 h-2 w-24 rounded-full bg-peach"></div>
			<h2 class="font-display text-3xl leading-tight">{open.title}</h2>
			{#if open.description}
				<p class="mt-3 text-slate">{open.description}</p>
			{/if}
			{#if open.url}
				<button
					type="button"
					class="mt-3 font-semibold text-primary underline"
					onclick={() => window.open(open.url!, '_blank', 'noopener,noreferrer')}
					>{t(data.locale, 'gift.openLink')}</button
				>
			{/if}
			{#if form?.message}
				<p class="mt-3 text-sm text-error">{form.message}</p>
			{/if}
			<div class="mt-6 grid grid-cols-2 gap-3">
				<form method="POST" action="?/received" use:enhance>
					<input type="hidden" name="giftId" value={open.id} />
					<button class="pressable btn w-full rounded-2xl btn-primary"
						>{t(data.locale, 'gift.markReceived')}</button
					>
				</form>
				<form method="POST" action="?/delete" use:enhance>
					<input type="hidden" name="giftId" value={open.id} />
					<button class="pressable btn w-full rounded-2xl btn-ghost"
						>{t(data.locale, 'gift.delete')}</button
					>
				</form>
			</div>
		</div>
	</div>
{/if}
