<script lang="ts">
	import { resolve } from '$app/paths';
	import { t, type Locale } from '$lib/i18n/catalog';

	let {
		name,
		locale,
		active = false
	}: {
		name: string;
		locale: Locale;
		active?: boolean;
	} = $props();

	const initial = $derived((name.trim()[0] ?? 'G').toUpperCase());
</script>

<a
	href={resolve('/settings')}
	class="pressable absolute top-3 right-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-content shadow-lg
		{active ? 'ring-2 ring-peach ring-offset-2 ring-offset-paper' : ''}"
	aria-label={t(locale, 'app.settings')}
	title={t(locale, 'app.settings')}
>
	{initial}
</a>
