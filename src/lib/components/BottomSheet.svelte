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
	<div class="fixed inset-0 z-[80] overflow-y-auto bg-paper">
		<div class="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pb-10 pt-4">
			{@render children()}
		</div>
	</div>
{/if}
