<script lang="ts">
	import { resolve } from '$app/paths';
	import LocalePills from '$lib/components/LocalePills.svelte';
	import { t } from '$lib/i18n/catalog';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
</script>

<main class="flex min-h-dvh flex-col px-5 pt-8 pb-10">
	<img src="/brand/mark.svg" alt="" class="mx-auto h-16 w-16" />
	<h1 class="mt-3 text-center font-display text-3xl">Geeft</h1>
	<p class="text-center text-sm text-slate">{t(data.locale, 'auth.noAccount')}</p>

	<form method="POST" class="mt-8 space-y-3">
		<label class="block text-sm font-semibold"
			>{t(data.locale, 'auth.firstName')}<input
				class="input mt-1 w-full rounded-2xl"
				name="firstName"
				required
			/></label
		>
		<label class="block text-sm font-semibold"
			>{t(data.locale, 'auth.lastName')}<input
				class="input mt-1 w-full rounded-2xl"
				name="lastName"
			/></label
		>
		<label class="block text-sm font-semibold"
			>{t(data.locale, 'auth.email')}<input
				class="input mt-1 w-full rounded-2xl"
				type="email"
				name="email"
				required
			/></label
		>
		<label class="block text-sm font-semibold"
			>{t(data.locale, 'auth.password')}<input
				class="input mt-1 w-full rounded-2xl"
				type="password"
				name="password"
				required
				minlength="8"
			/></label
		>
		<label class="block text-sm font-semibold"
			>{t(data.locale, 'auth.invite')}<input
				class="input mt-1 w-full rounded-2xl"
				name="invite"
				required
			/></label
		>
		<p class="pt-1 text-sm font-semibold">{t(data.locale, 'settings.language')}</p>
		<LocalePills value={data.locale} uiLocale={data.locale} />
		{#if form?.message}
			<p class="text-sm text-error">{form.message}</p>
		{/if}
		<button
			class="pressable btn h-11 w-full rounded-2xl text-sm font-bold btn-secondary"
			type="submit">{t(data.locale, 'auth.signup')}</button
		>
	</form>
	<a class="mt-5 text-center text-sm font-semibold text-slate underline" href={resolve('/login')}
		>{t(data.locale, 'auth.hasAccount')}</a
	>
</main>
