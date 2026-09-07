<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '$lib/i18n/catalog';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
</script>

<main class="flex min-h-dvh flex-col px-5 pt-10">
	<img src="/brand/logo.svg" alt="Geeft" class="mx-auto h-16 w-auto" />
	<p class="mt-3 text-center text-sm text-slate">{t(data.locale, 'auth.reset')}</p>

	{#if data.invalid}
		<p class="mt-10 text-center text-sm text-error">{t(data.locale, 'auth.reset.invalid')}</p>
		<a
			class="pressable mt-6 text-center text-sm font-semibold text-slate underline"
			href={resolve('/forgot-password')}>{t(data.locale, 'auth.forgot')}</a
		>
	{:else}
		<form method="POST" class="mt-10 space-y-4">
			<input type="hidden" name="token" value={data.token} />
			<label class="block text-sm font-semibold">
				{t(data.locale, 'auth.password.new')}
				<input
					class="input mt-1 w-full rounded-2xl"
					type="password"
					name="password"
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
			{#if form?.message}
				<p class="text-sm text-error">{form.message}</p>
			{/if}
			<button
				class="pressable btn mt-2 h-11 w-full rounded-2xl text-sm font-bold btn-primary"
				type="submit"
			>
				{t(data.locale, 'auth.reset.submit')}
			</button>
		</form>
	{/if}
</main>
