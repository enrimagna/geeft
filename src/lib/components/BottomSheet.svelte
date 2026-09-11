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
	<div class="fixed inset-0 z-[80] flex items-end justify-center" style="pointer-events: none">
		<button
			type="button"
			class="absolute inset-0 bg-ink/40"
			style="pointer-events: auto"
			aria-label="Close"
			onclick={() => onclose()}
		></button>
		<div
			class="relative z-10 flex max-h-[90dvh] w-full max-w-[430px] flex-col overflow-y-auto rounded-t-[2rem] bg-paper p-5 pb-10 shadow-2xl"
			style="pointer-events: auto"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			{@render children()}
		</div>
	</div>
{/if}
