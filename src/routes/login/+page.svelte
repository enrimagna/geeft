<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import LocalePills from '$lib/components/LocalePills.svelte';
	import { t } from '$lib/i18n/catalog';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
</script>

<main class="flex min-h-dvh flex-col px-5 pt-10">
	<img src="/brand/logo.svg" alt="Geeft" class="mx-auto h-16 w-auto" />
	<p class="mt-3 text-center text-sm text-slate">{t(data.locale, 'app.tagline')}</p>

	<form method="POST" class="mt-10 space-y-4">
		<label class="block text-sm font-semibold">
			{t(data.locale, 'auth.email')}
			<input
				class="input input-sm mt-1 h-10 w-full rounded-2xl"
				type="email"
				name="email"
				required
				autocomplete="email"
			/>
		</label>
		<label class="block text-sm font-semibold">
			{t(data.locale, 'auth.password')}
			<input
				class="input input-sm mt-1 h-10 w-full rounded-2xl"
				type="password"
				name="password"
				required
				autocomplete="current-password"
			/>
		</label>
		{#if form?.message}
			<p class="text-sm text-error">{form.message}</p>
		{/if}
		<button
			class="pressable btn mt-2 h-11 w-full rounded-2xl text-sm font-bold btn-primary"
			type="submit"
		>
			{t(data.locale, 'auth.login')}
		</button>
	</form>
	<a
		class="pressable mt-4 text-center text-sm font-semibold text-slate underline"
		href={resolve('/forgot-password')}>{t(data.locale, 'auth.forgot')}</a
	>
	<a
		class="pressable mt-4 text-center text-sm font-semibold text-slate underline"
		href={resolve('/signup')}>{t(data.locale, 'auth.noAccount')}</a
	>
	<form method="POST" action="?/locale" use:enhance class="mt-10">
		<p class="mb-2 text-center text-xs font-semibold text-slate">
			{t(data.locale, 'settings.language')}
		</p>
		<LocalePills value={data.locale} uiLocale={data.locale} autosubmit />
	</form>
</main>
