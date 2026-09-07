<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '$lib/i18n/catalog';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
</script>

<header class="px-5 pt-16">
	<a href={resolve('/settings')} class="text-xs font-bold tracking-[0.18em] text-slate uppercase"
		>{t(data.locale, 'action.back')} · {t(data.locale, 'app.settings')}</a
	>
	<h1 class="mt-2 font-display text-3xl font-semibold">{t(data.locale, 'app.family')}</h1>
</header>

<section class="mt-6 space-y-3 px-4">
	{#each data.families as fam, i (fam.id)}
		<article
			class="gift-card rounded-[1.6rem] border border-white/80 bg-white/80 p-4"
			style="--i:{i}"
			class:ring-2={fam.id === data.currentFamilyId}
			class:ring-peach={fam.id === data.currentFamilyId}
		>
			<div class="flex items-center justify-between gap-3">
				<div>
					<h2 class="font-display text-xl">{fam.name}</h2>
					<p class="text-xs font-bold tracking-widest text-slate uppercase">
						{fam.role === 'owner' ? t(data.locale, 'family.owner') : ''}
					</p>
				</div>
				{#if fam.id !== data.currentFamilyId}
					<form method="POST" action="?/switch">
						<input type="hidden" name="familyId" value={fam.id} />
						<button class="pressable btn rounded-2xl btn-primary btn-sm"
							>{t(data.locale, 'family.switch')}</button
						>
					</form>
				{/if}
			</div>
			{#if fam.role === 'owner'}
				<form method="POST" action="?/regenerate" class="mt-3">
					<input type="hidden" name="familyId" value={fam.id} />
					<button class="text-sm font-semibold text-primary underline"
						>{t(data.locale, 'family.regenerate')}</button
					>
				</form>
			{/if}
		</article>
	{/each}
</section>

{#if data.invite}
	<div class="ticket mx-4 mt-6 rounded-2xl bg-white p-5 text-center shadow-lg">
		<p class="text-xs font-bold tracking-[0.25em] text-slate uppercase">
			{t(data.locale, 'family.invite')}
		</p>
		<p class="mt-2 font-display text-xl break-all">{data.invite}</p>
	</div>
{/if}

<form method="POST" action="?/create" class="mt-8 space-y-3 px-4">
	<h2 class="font-display text-lg">{t(data.locale, 'family.create')}</h2>
	<input
		class="input w-full rounded-2xl"
		name="name"
		placeholder={t(data.locale, 'family.name')}
		required
	/>
	<button class="pressable btn w-full rounded-2xl btn-secondary"
		>{t(data.locale, 'family.create')}</button
	>
</form>

<form method="POST" action="?/join" class="mt-6 space-y-3 px-4">
	<h2 class="font-display text-lg">{t(data.locale, 'family.join')}</h2>
	<input
		class="input w-full rounded-2xl"
		name="invite"
		placeholder={t(data.locale, 'auth.invite')}
		required
	/>
	<button class="pressable btn w-full rounded-2xl btn-primary"
		>{t(data.locale, 'family.join')}</button
	>
</form>

{#if form?.message}
	<p class="px-4 pt-3 text-sm text-error">{form.message}</p>
{/if}
