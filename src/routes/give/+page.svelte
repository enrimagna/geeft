<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Composer from '$lib/components/Composer.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import GiftCard from '$lib/components/GiftCard.svelte';
	import BottomSheet from '$lib/components/BottomSheet.svelte';
	import { t } from '$lib/i18n/catalog';
	import type { GiveGift } from '$lib/server/visibility';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
	let gifts = $state<GiveGift[]>(data.gifts);
	let composer = $state(false);
	let pendingConfirm = $state<{ type: 'reserve' | 'unreserve'; id: string } | null>(null);
	/** Ignore card taps briefly after close (ghost click under the sheet). */
	let closedAt = 0;
	/** Sheet visibility follows data.giftId only — no parallel openId to desync from URL. */
	const open = $derived(data.giftId ? (gifts.find((g) => g.id === data.giftId) ?? null) : null);

	$effect(() => {
		gifts = data.gifts;
	});

	function applyReservation(id: string, reservation: GiveGift['reservation']) {
		gifts = gifts.map((g) => (g.id === id ? { ...g, reservation } : g));
	}

	function listUrl(extra: Record<string, string> = {}) {
		const params = new URLSearchParams();
		if (data.selected) params.set('list', data.selected);
		for (const [k, v] of Object.entries(extra)) params.set(k, v);
		const q = params.toString();
		return resolve(q ? `/give?${q}` : '/give');
	}

	function openGift(id: string) {
		if (Date.now() - closedAt < 500) return;
		pendingConfirm = null;
		void goto(listUrl({ gift: id }), { replaceState: true, keepFocus: true, noScroll: true });
	}

	function closeGift() {
		closedAt = Date.now();
		pendingConfirm = null;
		void goto(listUrl(), { replaceState: true, keepFocus: true, noScroll: true });
	}

	function askReserve() {
		if (!open || open.receivedAt) return;
		pendingConfirm = { type: 'reserve', id: open.id };
	}

	function askUnreserve() {
		if (!open || open.receivedAt) return;
		pendingConfirm = { type: 'unreserve', id: open.id };
	}
</script>

<header class="px-5 pt-16 pr-16">
	<p class="text-xs font-bold tracking-[0.2em] text-slate uppercase">{data.familyName}</p>
	<h1 class="font-display text-3xl font-semibold">{t(data.locale, 'app.give')}</h1>
</header>

<div class="mt-4 flex flex-wrap gap-2 px-4 pb-2">
	{#each data.lists as list (list.listId)}
		<a
			href={resolve(`/give?list=${list.listId}`)}
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

<BottomSheet open={open !== null} onclose={closeGift}>
	{#if open}
		<button
			type="button"
			class="mx-auto mb-4 block h-1.5 w-16 rounded-full bg-mist"
			onclick={closeGift}
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
				onclick={() => window.open(open.url!, '_blank', 'noopener,noreferrer')}
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
					onclick={askReserve}
					>{t(data.locale, 'action.reserve')}</button
				>
			{/if}
			{#if open.reservation === 'mine' && !open.receivedAt}
				<button
					type="button"
					class="pressable btn h-12 w-full rounded-2xl btn-ghost"
					onclick={askUnreserve}
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
			<ul class="mt-2 space-y-2">
				{#each data.comments as comment (comment.id)}
					<li class="rounded-2xl bg-white/80 p-3 text-sm">
						{comment.body}
						{#if comment.mine}
							<form method="POST" action="?/deleteComment" use:enhance class="mt-1">
								<input type="hidden" name="commentId" value={comment.id} />
								<button type="submit" class="text-xs font-semibold text-slate underline"
									>{t(data.locale, 'comment.delete')}</button
								>
							</form>
						{/if}
					</li>
				{/each}
			</ul>
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
			onclick={closeGift}>{t(data.locale, 'action.cancel')}</button
		>
	{/if}
	</BottomSheet>


<ConfirmDialog
	open={Boolean(pendingConfirm)}
	locale={data.locale}
	title={pendingConfirm?.type === 'unreserve'
		? t(data.locale, 'gift.unreserve.confirm')
		: t(data.locale, 'gift.reserve.confirm')}
	oncancel={() => (pendingConfirm = null)}
	onconfirm={() => {
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
	}}
/>

{#if data.selected}
	<form method="POST" action="?/secret" class="hidden">
		<input type="hidden" name="listId" value={data.selected} />
	</form>
{/if}
