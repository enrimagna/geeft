<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import LocalePills from '$lib/components/LocalePills.svelte';
	import { t } from '$lib/i18n/catalog';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
</script>

<header class="px-5 pt-16">
	<p class="text-xs font-bold tracking-[0.2em] text-slate uppercase">{data.user?.firstName}</p>
	<h1 class="font-display text-3xl font-semibold">{t(data.locale, 'app.settings')}</h1>
	<p class="mt-1 text-sm text-slate">{data.email}</p>
</header>

<section class="mt-8 px-4">
	<h2 class="font-display text-lg font-semibold">{t(data.locale, 'settings.language')}</h2>
	<form method="POST" action="?/locale" use:enhance class="mt-3">
		<LocalePills value={data.locale} uiLocale={data.locale} autosubmit />
	</form>
</section>

<section class="mt-8 px-4">
	<h2 class="font-display text-lg font-semibold">{t(data.locale, 'settings.password')}</h2>
	<p class="mt-1 text-xs text-slate">{t(data.locale, 'settings.password.hint')}</p>
	<form method="POST" action="?/password" use:enhance class="mt-3 space-y-3">
		<label class="block text-sm font-semibold">
			{t(data.locale, 'auth.password.current')}
			<input
				class="input mt-1 w-full rounded-2xl"
				type="password"
				name="currentPassword"
				required
				minlength="8"
				autocomplete="current-password"
			/>
		</label>
		<label class="block text-sm font-semibold">
			{t(data.locale, 'auth.password.new')}
			<input
				class="input mt-1 w-full rounded-2xl"
				type="password"
				name="newPassword"
				required
				minlength="8"
				autocomplete="new-password"
			/>
		</label>
		<label class="block text-sm font-semibold">
			{t(data.locale, 'auth.password.confirm')}
			<input
				class="input mt-1 w-full rounded-2xl"
				type="password"
				name="confirm"
				required
				minlength="8"
				autocomplete="new-password"
			/>
		</label>
		{#if form && 'passwordChanged' in form && form.passwordChanged}
			<p class="text-sm text-success">{t(data.locale, 'auth.password.changed')}</p>
		{/if}
		<button
			class="pressable btn h-11 w-full rounded-2xl text-sm font-bold btn-primary"
			type="submit">{t(data.locale, 'action.save')}</button
		>
	</form>
</section>

<section class="mt-8 space-y-3 px-4">
	<a
		href={resolve('/settings/lists')}
		class="pressable flex items-center justify-between rounded-[1.4rem] border border-white/80 bg-white/80 px-4 py-3 shadow-sm"
	>
		<div>
			<p class="font-display text-lg">{t(data.locale, 'settings.lists')}</p>
			<p class="text-xs text-slate">{t(data.locale, 'settings.lists.hint')}</p>
		</div>
		<span class="text-xl text-slate" aria-hidden="true">›</span>
	</a>
	<a
		href={resolve('/settings/family')}
		class="pressable flex items-center justify-between rounded-[1.4rem] border border-white/80 bg-white/80 px-4 py-3 shadow-sm"
	>
		<div>
			<p class="font-display text-lg">{t(data.locale, 'app.family')}</p>
			<p class="text-xs text-slate">{t(data.locale, 'settings.family.hint')}</p>
		</div>
		<span class="text-xl text-slate" aria-hidden="true">›</span>
	</a>
</section>

{#if form && 'message' in form && form.message}
	<p class="px-4 pt-3 text-sm text-error">{form.message}</p>
{/if}

<form method="POST" action="?/logout" class="px-4 pt-10">
	<button class="pressable btn w-full rounded-2xl btn-ghost"
		>{t(data.locale, 'action.logout')}</button
	>
</form>
