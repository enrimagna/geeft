<script lang="ts">
	import { resolve } from '$app/paths';
	import { t, type Locale } from '$lib/i18n/catalog';

	let { locale, current }: { locale: Locale; current: 'receive' | 'give' | null } = $props();
</script>

<nav
	class="fixed bottom-3 left-1/2 z-30 w-[min(100%-1.5rem,400px)] -translate-x-1/2 rounded-[1.6rem] border border-white/70 bg-paper/80 p-1 shadow-[0_18px_50px_-20px_rgba(28,25,23,0.45)] backdrop-blur-xl"
>
	<div class="relative grid grid-cols-2">
		{#if current}
			<div
				class="nav-pill absolute top-1 bottom-1 w-1/2 rounded-[1.3rem] bg-primary shadow-lg"
				style="transform: translateX({current === 'give' ? '100%' : '0'})"
			></div>
		{/if}
		<a
			href={resolve('/receive')}
			class="pressable relative z-10 flex flex-col items-center justify-center gap-0.5 py-2 text-xs font-semibold
				{current === 'receive' ? 'text-primary-content' : 'text-slate'}"
		>
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
				><path d="M4 7h16v10H4z" /><path d="M4 11h16" /><path d="M9 15h6" /></svg
			>
			{t(locale, 'app.receive')}
		</a>
		<a
			href={resolve('/give')}
			class="pressable relative z-10 flex flex-col items-center justify-center gap-0.5 py-2 text-xs font-semibold
				{current === 'give' ? 'text-primary-content' : 'text-slate'}"
		>
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
				><rect x="4" y="9" width="16" height="11" rx="2" /><path d="M12 9v11M4 13h16" /><path
					d="M8 6c0-2 2-3 4-1 2-2 4-1 4 1v3H8z"
				/></svg
			>
			{t(locale, 'app.give')}
		</a>
	</div>
</nav>
