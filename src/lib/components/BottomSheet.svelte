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
		return chrome.acquire();
	});
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-end justify-center">
		<button
			type="button"
			class="absolute inset-0 bg-ink/40"
			onclick={onclose}
			aria-label="Close"
		></button>
		<div
			class="relative z-10 flex max-h-[90dvh] w-full max-w-[430px] flex-col overflow-y-auto rounded-t-[2rem] bg-paper p-5 pb-10 shadow-2xl"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
		>
			{@render children()}
		</div>
	</div>
{/if}
