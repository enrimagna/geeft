<script lang="ts">
	import { chrome } from '$lib/chrome.svelte';
	import { onTap } from '$lib/actions/onTap';
	import { swipeDismiss } from '$lib/actions/swipeDismiss';
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
		class="fixed inset-0 flex items-end justify-center sm:items-end sm:justify-center sm:p-0"
		style="z-index: 200"
		role="presentation"
	>
		<div class="absolute inset-0 bg-ink/40" use:onTap={onclose} aria-hidden="true"></div>
		<div
			class="relative z-10 flex max-h-[90dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[2rem] bg-paper shadow-2xl"
			role="dialog"
			aria-modal="true"
			use:swipeDismiss={{ onclose, threshold: 72 }}
		>
			<div
				data-sheet-handle
				class="flex shrink-0 cursor-grab touch-none flex-col items-center pt-3 pb-1 active:cursor-grabbing"
			>
				<button
					type="button"
					data-sheet-handle
					class="block h-1.5 w-12 rounded-full bg-mist"
					aria-label="Close"
					use:onTap={onclose}
				></button>
			</div>
			<div
				data-sheet-scroll
				class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-1 pb-8"
			>
				{@render children()}
			</div>
		</div>
	</div>
{/if}
