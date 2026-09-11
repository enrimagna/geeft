<script lang="ts">
	import { enhance } from '$app/forms';
	import { t, type Locale } from '$lib/i18n/catalog';
	import BottomSheet from '$lib/components/BottomSheet.svelte';

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
</script>

<BottomSheet {open} {onclose}>
	{#if open}
		<form
			method="POST"
			{action}
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
				<button class="pressable btn rounded-2xl btn-ghost" type="button" onclick={onclose}
					>{t(locale, 'action.cancel')}</button
				>
				<button class="pressable btn rounded-2xl font-bold btn-secondary" type="submit"
					>{t(locale, 'action.save')}</button
				>
			</div>
		</form>
	{/if}
</BottomSheet>
