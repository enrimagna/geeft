<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Composer from '$lib/components/Composer.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import GiftCard from '$lib/components/GiftCard.svelte';
	import { chrome } from '$lib/chrome.svelte';
	import { t } from '$lib/i18n/catalog';
	import type { GiveGift } from '$lib/server/visibility';
	import type { ActionData, PageProps } from './$types';
	import type { Action } from 'svelte/action';
	import { onTap } from '$lib/actions/onTap';

	let { data, form }: PageProps & { form: ActionData } = $props();
	let gifts = $state<GiveGift[]>(data.gifts);
	let composer = $state(false);
	let openId = $state<string | null>(null);
	let pendingConfirm = $state<{ type: 'reserve' | 'unreserve'; id: string } | null>(null);
	let closedAt = 0;
	const open = $derived(openId ? (gifts.find((g) => g.id === openId) ?? null) : null);

	$effect(() => {
		gifts = data.gifts;
	});

	$effect(() => {
		if (!openId && !pendingConfirm) return;
		return chrome.acquire();
	});

	const portal: Action<HTMLElement> = (node) => {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
	};

	function applyReservation(id: string, reservation: GiveGift['reservation']) {
		gifts = gifts.map((g) => (g.id === id ? { ...g, reservation } : g));
	}

	function openGift(id: string) {
		if (Date.now() - closedAt < 500) return;
		pendingConfirm = null;
		openId = id;
	}

	function closeGift() {
		closedAt = Date.now();
		pendingConfirm = null;
		openId = null;
	}

	function confirmPending() {
		if (!pendingConfirm) return;
		const id = pendingConfirm.id;
		const type = pendingConfirm.type;
		pendingConfirm = null;
		applyReservation(id, type === 'reserve' ? 'mine' : 'none');
		const fd = new FormData();
		fd.set('giftId', id);
		fetch(`?/${type}`, { method: 'POST', body: fd, credentials: 'include' }).catch(() => {
			applyReservation(id, type === 'reserve' ? 'none' : 'mine');
		});
	}
</script>

<div inert={open ? true : undefined}>
	<header class="px-5 pt-16 pr-16">
		<p class="text-xs font-bold tracking-[0.2em] text-slate uppercase">{data.familyName}</p>
		<h1 class="font-display text-3xl font-semibold">{t(data.locale, 'app.give')}</h1>
	</header>

	<div class="mt-4 flex flex-wrap gap-2 px-4 pb-2">
		{#each data.lists as list (list.listId)}
			<a
				href={`${resolve('/give')}?list=${list.listId}`}
				class="pressable inline-flex max-w-full shrink-0 items-center rounded-full px-3 py-1.5 text-sm font-semibold
					{data.selected === list.listId
					? 'bg-primary text-primary-content shadow-sm'
					: 'bg-white/80 text-slate'}">{list.name}</a
			>
		{/each}
	</div>

	<section class="mt-3 space-y-3 px-4">
		{#if gifts.length === 0}
			<EmptyState title={t(data.locale, 'empty.give')} />
		{/if}
		{#each gifts as gift, i (gift.id)}
			<GiftCard {gift} index={i} locale={data.locale} mode="give" onclick={() => openGift(gift.id)} />
		{/each}
	</section>

	{#if data.selected}
		<button
			class="fab-box pressable btn fixed right-4 bottom-24 z-20 h-16 w-16 rounded-3xl text-3xl shadow-xl btn-primary"
			onclick={() => (composer = true)}
			aria-label={t(data.locale, 'gift.addSecret')}>+</button
		>
		<Composer
			open={composer}
			locale={data.locale}
			action="?/secret"
			secret
			hidden={{ listId: data.selected }}
			onclose={() => (composer = false)}
		/>
	{/if}
</div>

{#if open}
	<div
		use:portal
		class="fixed inset-0 overflow-y-auto bg-paper"
		style="z-index: 200"
		role="dialog"
		aria-modal="true"
		aria-label={open.title}
	>
		<div class="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pb-10 pt-4">
			<button
				type="button"
				class="mx-auto mb-4 block h-1.5 w-16 rounded-full bg-mist"
				use:onTap={closeGift}
				aria-label={t(data.locale, 'action.close')}
			></button>
			{#if open.hiddenFromRecipient}
				<p class="mb-2 text-xs font-bold tracking-widest text-peach uppercase">
					{t(data.locale, 'gift.secret')}
				</p>
			{/if}
			<h2 class="font-display text-3xl leading-tight">{open.title}</h2>
			{#if open.description}
				<p class="mt-3 text-slate">{open.description}</p>
			{/if}
			{#if open.url}
				<button
					type="button"
					class="mt-3 font-semibold text-primary underline"
					use:onTap={() => window.open(open.url!, '_blank', 'noopener,noreferrer')}
					>{t(data.locale, 'gift.openLink')}</button
				>
			{/if}
			{#if open.receivedAt}
				<p class="mt-3 text-sm font-semibold text-slate">{t(data.locale, 'gift.received')}</p>
			{/if}
			{#if form && 'message' in form && form.message && !('ok' in form)}
				<p class="mt-3 text-sm text-error">{form.message}</p>
			{/if}

			<div class="mt-5 space-y-2">
				{#if open.reservation === 'none' && !open.receivedAt}
					<button
						type="button"
						class="pressable btn h-12 w-full rounded-2xl font-bold btn-secondary"
						use:onTap={() => (pendingConfirm = { type: 'reserve', id: open.id })}
						>{t(data.locale, 'action.reserve')}</button
					>
				{/if}
				{#if open.reservation === 'mine' && !open.receivedAt}
					<button
						type="button"
						class="pressable btn h-12 w-full rounded-2xl btn-ghost"
						use:onTap={() => (pendingConfirm = { type: 'unreserve', id: open.id })}
						>{t(data.locale, 'action.unreserve')}</button
					>
				{/if}
				{#if open.hiddenFromRecipient && open.createdByMe}
					<form
						method="POST"
						action="?/deliver"
						use:enhance={() => {
							return async ({ result, update }) => {
								await update();
								if (result.type === 'success') closeGift();
							};
						}}
					>
						<input type="hidden" name="giftId" value={open.id} />
						<button type="submit" class="pressable btn h-12 w-full rounded-2xl btn-primary"
							>{t(data.locale, 'gift.deliver')}</button
						>
					</form>
					<form
						method="POST"
						action="?/withdraw"
						use:enhance={() => {
							const id = open.id;
							return async ({ result }) => {
								if (result.type !== 'success') return;
								gifts = gifts.filter((g) => g.id !== id);
								closeGift();
							};
						}}
					>
						<input type="hidden" name="giftId" value={open.id} />
						<button type="submit" class="pressable btn h-12 w-full rounded-2xl btn-ghost"
							>{t(data.locale, 'gift.withdraw')}</button
						>
					</form>
				{/if}
			</div>

			<div class="mt-6">
				<h3 class="text-sm font-bold tracking-wide text-slate uppercase">
					{t(data.locale, 'comment.add')}
				</h3>
				<form method="POST" action="?/comment" use:enhance class="mt-3 flex gap-2">
					<input type="hidden" name="giftId" value={open.id} />
					<input
						class="input flex-1 rounded-2xl input-sm"
						name="body"
						placeholder={t(data.locale, 'comment.placeholder')}
					/>
					<button type="submit" class="pressable btn rounded-2xl btn-secondary"
						>{t(data.locale, 'action.save')}</button
					>
				</form>
			</div>
			<button
				type="button"
				class="pressable btn mt-6 h-12 w-full rounded-2xl btn-ghost"
				use:onTap={closeGift}>{t(data.locale, 'action.cancel')}</button
			>
		</div>
	</div>
{/if}

{#if pendingConfirm}
	<div
		use:portal
		class="fixed inset-0 flex items-end justify-center bg-ink/35 p-4 sm:items-center"
		style="z-index: 300"
		role="presentation"
	>
		<div class="w-full max-w-sm rounded-[2rem] bg-paper p-6 shadow-2xl" role="dialog" aria-modal="true">
			<p class="text-center font-display text-2xl leading-tight font-semibold">
				{pendingConfirm.type === 'unreserve'
					? t(data.locale, 'gift.unreserve.confirm')
					: t(data.locale, 'gift.reserve.confirm')}
			</p>
			<div class="mt-6 grid grid-cols-2 gap-3">
				<button
					class="pressable btn rounded-2xl btn-ghost"
					type="button"
					use:onTap={() => (pendingConfirm = null)}>{t(data.locale, 'action.cancel')}</button
				>
				<button
					class="pressable btn rounded-2xl font-bold btn-secondary"
					type="button"
					use:onTap={confirmPending}>{t(data.locale, 'action.confirm')}</button
				>
			</div>
		</div>
	</div>
{/if}

{#if data.selected}
	<form method="POST" action="?/secret" class="hidden">
		<input type="hidden" name="listId" value={data.selected} />
	</form>
{/if}
