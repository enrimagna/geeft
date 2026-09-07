<script lang="ts">
	import { locales, t, type Locale } from '$lib/i18n/catalog';

	let {
		value,
		name = 'locale',
		uiLocale,
		autosubmit = false
	}: {
		value: Locale;
		name?: string;
		uiLocale: Locale;
		autosubmit?: boolean;
	} = $props();
</script>

<div class="flex flex-col gap-2">
	{#each locales as loc (loc)}
		<label class="pressable cursor-pointer">
			<input
				class="peer sr-only"
				type="radio"
				{name}
				value={loc}
				checked={value === loc}
				onchange={(event) => {
					if (autosubmit) event.currentTarget.form?.requestSubmit();
				}}
			/>
			<span
				class="flex min-h-11 items-center justify-between rounded-2xl border-2 border-mist bg-white/70 px-4 py-2 text-sm font-semibold peer-checked:border-peach peer-checked:bg-peach peer-checked:text-ink"
			>
				<span
					>{loc === 'it'
						? t(uiLocale, 'locale.it')
						: loc === 'fr'
							? t(uiLocale, 'locale.fr')
							: t(uiLocale, 'locale.en')}</span
				>
				<span class="text-xs font-bold tracking-wider uppercase opacity-70">{loc}</span>
			</span>
		</label>
	{/each}
</div>
