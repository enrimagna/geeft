<script lang="ts">
	import { t, type Locale } from '$lib/i18n/catalog';
	import type { GiveGift, ReceiveGift } from '$lib/server/visibility';

	let {
		gift,
		index,
		locale,
		mode,
		onclick
	}: {
		gift: ReceiveGift | GiveGift;
		index: number;
		locale: Locale;
		mode: 'receive' | 'give';
		onclick: () => void;
	} = $props();

	let node = $state<HTMLButtonElement | null>(null);

	const give = $derived(mode === 'give' ? (gift as GiveGift) : null);

	function tilt(event: PointerEvent) {
		if (!node) return;
		const r = node.getBoundingClientRect();
		const x = (event.clientX - r.left) / r.width - 0.5;
		const y = (event.clientY - r.top) / r.height - 0.5;
		node.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 8}deg) translateY(-2px)`;
	}

	function reset() {
		if (node) node.style.transform = '';
	}
</script>

<button
	bind:this={node}
	type="button"
	class="gift-card relative w-full overflow-hidden rounded-[1.6rem] border border-white/80 bg-white/80 p-4 text-left shadow-[0_14px_40px_-24px_rgba(28,25,23,0.55)] backdrop-blur-md"
	style="--i:{index}"
	{onclick}
	onpointermove={tilt}
	onpointerleave={reset}
>
	<div class="ribbon absolute top-0 bottom-0 left-0 w-2 bg-peach"></div>
	<div class="absolute top-0 left-8 h-2 w-16 bg-peach/80"></div>
	{#if give?.hiddenFromRecipient}
		<span
			class="absolute top-3 right-3 rounded-full bg-slate px-2 py-1 text-[10px] font-bold tracking-wide text-paper uppercase"
			>{t(locale, 'gift.secret')}</span
		>
	{/if}
	<h3 class="line-clamp-2 pr-16 font-display text-[1.2rem] leading-tight font-semibold text-ink">
		{gift.title}
	</h3>
	{#if gift.description}
		<p class="mt-2 line-clamp-2 text-sm text-slate">{gift.description}</p>
	{/if}
	<div class="mt-3 flex min-h-8 items-center gap-2">
		{#if gift.receivedAt}
			<span class="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-slate"
				>{t(locale, 'gift.received')}</span
			>
		{/if}
		{#if give?.reservation === 'mine'}
			<span class="stamp rounded-full bg-peach px-3 py-1 text-xs font-bold text-ink"
				>{t(locale, 'gift.badge.mine')}</span
			>
		{:else if give?.reservation === 'other'}
			<span class="stamp rounded-full bg-slate px-3 py-1 text-xs font-bold text-paper"
				>{t(locale, 'gift.badge.other')}</span
			>
		{/if}
	</div>
</button>
