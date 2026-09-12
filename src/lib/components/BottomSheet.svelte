<script lang="ts">
	import { Drawer } from 'vaul-svelte';
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

	/** vaul does not forward openFocus to bits-ui Dialog, so block autofocus ourselves. */
	$effect(() => {
		if (!open) return;
		const until = Date.now() + 600;
		const block = (e: FocusEvent) => {
			if (Date.now() > until) return;
			const t = e.target;
			if (!(t instanceof HTMLElement)) return;
			if (!t.matches('input, textarea, select, [contenteditable="true"]')) return;
			if (!t.closest('[data-vaul-drawer]')) return;
			t.blur();
		};
		document.addEventListener('focusin', block, true);
		const timers = [0, 50, 150, 300].map((ms) =>
			window.setTimeout(() => {
				const a = document.activeElement;
				if (
					a instanceof HTMLElement &&
					a.closest('[data-vaul-drawer]') &&
					a.matches('input, textarea, select, [contenteditable="true"]')
				) {
					a.blur();
				}
			}, ms)
		);
		return () => {
			document.removeEventListener('focusin', block, true);
			for (const id of timers) window.clearTimeout(id);
		};
	});
</script>

<Drawer.Root
	{open}
	onOpenChange={(next) => {
		if (!next) onclose();
	}}
	shouldScaleBackground={false}
	closeThreshold={0.22}
	direction="bottom"
>
	<Drawer.Portal>
		<Drawer.Overlay class="fixed inset-0 z-[200] bg-ink/40" />
		<Drawer.Content
			tabindex="-1"
			class="fixed inset-x-0 bottom-0 z-[200] mx-auto flex max-h-[90dvh] w-full max-w-[430px] flex-col rounded-t-[2rem] bg-paper outline-none"
		>
			<div class="mx-auto mt-3 mb-2 h-1.5 w-12 shrink-0 rounded-full bg-mist" aria-hidden="true"></div>
			<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
				{@render children()}
			</div>
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>
