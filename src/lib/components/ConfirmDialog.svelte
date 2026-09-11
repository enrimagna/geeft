<script lang="ts">
	import { t, type Locale } from '$lib/i18n/catalog';
	import { chrome } from '$lib/chrome.svelte';
	import { fade, scale } from 'svelte/transition';

	let {
		open,
		locale,
		title,
		oncancel,
		onconfirm
	}: {
		open: boolean;
		locale: Locale;
		title: string;
		oncancel: () => void;
		onconfirm: () => void;
	} = $props();

	$effect(() => {
		if (!open) return;
		return chrome.acquire();
	});
</script>

{#if open}
	<div class="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center">
		<button
			type="button"
			class="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
			onclick={oncancel}
			transition:fade={{ duration: 180 }}
			aria-label={t(locale, 'action.close')}
		></button>
		<div
			class="relative w-full max-w-sm overflow-hidden rounded-[2rem] bg-paper p-6 shadow-2xl"
			transition:scale={{ duration: 280, start: 0.86 }}
			role="dialog"
			aria-modal="true"
		>
			<svg class="mx-auto mb-3 h-16 w-24" viewBox="0 0 120 80" aria-hidden="true">
				<rect x="18" y="28" width="84" height="42" rx="10" fill="#5C6B7A" />
				<rect x="54" y="28" width="12" height="42" fill="#E8A87C" />
				<rect x="18" y="44" width="84" height="10" fill="#E8A87C" />
				<path
					d="M40 22 C40 8, 54 8, 60 22 C66 8, 80 8, 80 22"
					fill="none"
					stroke="#E8A87C"
					stroke-width="7"
					stroke-linecap="round"
					class="origin-center"
					style="animation: wiggle 1.4s ease-in-out infinite"
				/>
			</svg>
			<p class="text-center font-display text-2xl leading-tight font-semibold">{title}</p>
			<div class="mt-6 grid grid-cols-2 gap-3">
				<button class="pressable btn rounded-2xl btn-ghost" type="button" onclick={oncancel}
					>{t(locale, 'action.cancel')}</button
				>
				<button
					class="pressable btn rounded-2xl font-bold btn-secondary"
					type="button"
					onclick={onconfirm}>{t(locale, 'action.confirm')}</button
				>
			</div>
		</div>
	</div>
{/if}
