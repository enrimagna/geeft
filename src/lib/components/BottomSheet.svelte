<script lang="ts">
	import { chrome } from '$lib/chrome.svelte';
	import type { Snippet } from 'svelte';

	let {
		open,
		onclose,
		children
	}: {
		open: boolean;
		onclose: () => void;
		children: Snippet;
	} = $props();

	$effect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onclose();
		};
		window.addEventListener('keydown', onKey);
		const release = chrome.acquire();
		return () => {
			window.removeEventListener('keydown', onKey);
			release();
		};
	});
</script>

{#if open}
	<!-- One layer: the dimmed scrim IS the outer flex box. No absolute full-screen
	     sibling sitting on top of the panel (that ate Prenota/Annulla clicks). -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[80] flex items-end justify-center bg-ink/40"
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) onclose();
		}}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="flex max-h-[90dvh] w-full max-w-[430px] flex-col overflow-y-auto rounded-t-[2rem] bg-paper p-5 pb-10 shadow-2xl"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
		>
			{@render children()}
		</div>
	</div>
{/if}
