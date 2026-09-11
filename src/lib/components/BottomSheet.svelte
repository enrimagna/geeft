<script lang="ts">
	import { chrome } from '$lib/chrome.svelte';
	import type { Action } from 'svelte/action';
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

	const portal: Action<HTMLElement> = (node) => {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
	};

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
	<div
		use:portal
		class="fixed inset-0 overflow-y-auto bg-paper"
		style="z-index: 200"
		role="dialog"
		aria-modal="true"
	>
		<div class="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pb-10 pt-4">
			{@render children()}
		</div>
	</div>
{/if}
