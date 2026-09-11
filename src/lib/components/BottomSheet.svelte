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
			class="fixed inset-x-0 bottom-0 z-[200] mx-auto flex max-h-[90dvh] w-full max-w-[430px] flex-col rounded-t-[2rem] bg-paper outline-none"
		>
			<div class="mx-auto mt-3 mb-2 h-1.5 w-12 shrink-0 rounded-full bg-mist" aria-hidden="true"></div>
			<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
				{@render children()}
			</div>
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>
