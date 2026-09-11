<script lang="ts">
	import { enhance } from '$app/forms';
	import { t, type Locale } from '$lib/i18n/catalog';
	import { swipeDismiss } from '$lib/actions/swipeDismiss';
	import { chrome } from '$lib/chrome.svelte';
	import { fly } from 'svelte/transition';

	let {
		open,
		locale,
		action,
		secret = false,
		hidden = {},
		onclose
	}: {
		open: boolean;
		locale: Locale;
		action: string;
		secret?: boolean;
		hidden?: Record<string, string>;
		onclose: () => void;
	} = $props();

	let shielding = $state(false);

	$effect(() => {
		if (!open) return;
		return chrome.acquire();
	});

	function dismiss() {
		if (shielding) return;
		shielding = true;
		onclose();
		window.setTimeout(() => {
			shielding = false;
		}, 450);
	}
</script>

{#if shielding}
	<div class="fixed inset-0 z-[80]" aria-hidden="true"></div>
{/if}

{#if open}
	<div class="fixed inset-0 z-50">
		<button
			type="button"
			class="absolute inset-0 bg-ink/30"
			onpointerdown={(e) => {
				e.preventDefault();
				e.stopPropagation();
				dismiss();
			}}
			aria-label={t(locale, 'action.close')}
		></button>
		<form
			method="POST"
			{action}
			class="absolute inset-x-0 bottom-0 z-10 rounded-t-[2rem] bg-paper p-5 pb-8 shadow-2xl"
			transition:fly={{ y: 80, duration: 320 }}
			use:swipeDismiss={{ onclose: dismiss }}
			onpointerdown={(e) => e.stopPropagation()}
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						onclose();
						await update();
						return;
					}
					await update();
				};
			}}
		>
			{#each Object.entries(hidden) as [key, value] (key)}
				<input type="hidden" name={key} {value} />
			{/each}
			<button
				type="button"
				class="mx-auto mb-4 block h-1.5 w-16 rounded-full bg-mist"
				onpointerdown={(e) => { e.preventDefault(); e.stopPropagation(); dismiss(); }}
				aria-label={t(locale, 'action.close')}
			></button>
			<h2 class="font-display text-2xl font-semibold">
				{secret ? t(locale, 'gift.addSecret') : t(locale, 'gift.add')}
			</h2>
			{#if secret}
				<p class="mt-1 text-sm text-slate">{t(locale, 'gift.secret.hint')}</p>
			{/if}
			<label class="mt-4 block text-sm font-semibold">
				{t(locale, 'gift.title')}
				<input class="input mt-1 w-full rounded-2xl input-sm" name="title" required minlength="1" />
			</label>
			<label class="mt-3 block text-sm font-semibold">
				{t(locale, 'gift.description')}
				<textarea class="textarea mt-1 w-full rounded-2xl textarea-sm" name="description" rows="3"
				></textarea>
			</label>
			<label class="mt-3 block text-sm font-semibold">
				{t(locale, 'gift.url')}
				<input class="input mt-1 w-full rounded-2xl input-sm" name="url" placeholder="https://" />
			</label>
			<div class="mt-5 grid grid-cols-2 gap-3">
				<button class="pressable btn rounded-2xl btn-ghost" type="button" onpointerdown={(e) => { e.preventDefault(); e.stopPropagation(); dismiss(); }}
					>{t(locale, 'action.cancel')}</button
				>
				<button class="pressable btn rounded-2xl font-bold btn-secondary" type="submit"
					>{t(locale, 'action.save')}</button
				>
			</div>
		</form>
	</div>
{/if}
