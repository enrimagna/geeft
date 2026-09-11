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

	let dialog = $state<HTMLDialogElement | null>(null);
	let closing = false;

	$effect(() => {
		const el = dialog;
		if (!el) return;
		if (open) {
			closing = false;
			if (!el.open) el.showModal();
		} else if (el.open) {
			el.close();
		}
	});

	$effect(() => {
		if (!open) return;
		return chrome.acquire();
	});

	function requestClose() {
		if (closing) return;
		closing = true;
		onclose();
	}

	function onDialogClose() {
		if (open) requestClose();
		closing = false;
	}

	function onDialogClick(e: MouseEvent) {
		if (e.target === dialog) requestClose();
	}
</script>

<dialog
	bind:this={dialog}
	class="geeft-sheet"
	onclose={onDialogClose}
	onclick={onDialogClick}
>
	<div class="geeft-sheet-panel" role="document">
		{@render children()}
	</div>
</dialog>

<style>
	.geeft-sheet {
		position: fixed;
		inset: auto 0 0 0;
		margin: 0 auto;
		width: min(100%, 430px);
		max-height: 90dvh;
		border: none;
		padding: 0;
		background: transparent;
		color: inherit;
	}
	.geeft-sheet[open] {
		display: block;
	}
	.geeft-sheet::backdrop {
		background: rgba(28, 25, 23, 0.4);
	}
	.geeft-sheet-panel {
		width: 100%;
		max-height: 90dvh;
		overflow-y: auto;
		border-radius: 2rem 2rem 0 0;
		background: #faf7f2;
		padding: 1.25rem 1.25rem 2.5rem;
		box-shadow: 0 25px 50px -12px rgba(28, 25, 23, 0.35);
	}
</style>
