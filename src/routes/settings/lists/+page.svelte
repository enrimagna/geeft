<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { t } from '$lib/i18n/catalog';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
</script>

<header class="px-5 pt-16">
	<a href={resolve('/settings')} class="text-xs font-bold tracking-[0.18em] text-slate uppercase"
		>{t(data.locale, 'action.back')} · {t(data.locale, 'app.settings')}</a
	>
	<h1 class="mt-2 font-display text-3xl font-semibold">{t(data.locale, 'settings.lists')}</h1>
	<p class="mt-1 text-sm text-slate">{t(data.locale, 'settings.lists.hint')}</p>
</header>

<form method="POST" action="?/create" use:enhance class="mt-6 space-y-3 px-4">
	<h2 class="font-display text-lg">{t(data.locale, 'lists.create')}</h2>
	<input
		class="input w-full rounded-2xl input-sm"
		name="name"
		placeholder={t(data.locale, 'lists.name')}
		required
	/>
	<button class="pressable btn w-full rounded-2xl btn-secondary"
		>{t(data.locale, 'lists.create')}</button
	>
</form>

{#if form && 'message' in form && form.message}
	<p class="px-4 pt-3 text-sm text-error">{form.message}</p>
{/if}

<section class="mt-8 space-y-4 px-4 pb-8">
	{#if data.lists.length === 0}
		<p class="text-sm text-slate">{t(data.locale, 'lists.empty')}</p>
	{/if}
	{#each data.lists as list (list.id)}
		{@const candidates = list.members.filter((m) => !list.admins.some((a) => a.id === m.id))}
		<article class="rounded-[1.5rem] border border-white/80 bg-white/80 p-4">
			<h2 class="font-display text-xl">{list.name}</h2>

			{#if data.families.length > 1}
				<p class="mt-3 text-xs font-bold tracking-wide text-slate uppercase">
					{t(data.locale, 'lists.share')}
				</p>
				<p class="mt-1 text-xs text-slate">{t(data.locale, 'lists.share.hint')}</p>
				<form method="POST" action="?/shares" use:enhance class="mt-2 space-y-2">
					<input type="hidden" name="listId" value={list.id} />
					{#each data.families as fam (fam.id)}
						<label class="flex min-h-11 items-center gap-2 text-sm">
							<input
								class="checkbox checkbox-sm"
								type="checkbox"
								name="familyId"
								value={fam.id}
								checked={list.shares.some((s) => s.id === fam.id)}
								onchange={(event) => {
									const formEl = event.currentTarget.form;
									if (!formEl) return;
									const checked = formEl.querySelectorAll('input[name="familyId"]:checked');
									if (checked.length === 0) {
										event.currentTarget.checked = true;
										return;
									}
									formEl.requestSubmit();
								}}
							/>
							{fam.name}
						</label>
					{/each}
				</form>
			{/if}

			<p class="mt-3 text-xs font-bold tracking-wide text-slate uppercase">
				{t(data.locale, 'lists.admins')}
			</p>
			<ul class="mt-2 space-y-1">
				{#each list.admins as admin (admin.id)}
					<li class="flex items-center justify-between text-sm">
						<span>
							{admin.firstName}
							{#if admin.id === data.user?.id}
								<span class="text-slate">({t(data.locale, 'lists.you')})</span>
							{/if}
						</span>
						{#if list.admins.length > 1}
							<form method="POST" action="?/removeAdmin" use:enhance>
								<input type="hidden" name="listId" value={list.id} />
								<input type="hidden" name="userId" value={admin.id} />
								<button class="text-xs font-semibold text-slate underline"
									>{t(data.locale, 'lists.removeAdmin')}</button
								>
							</form>
						{/if}
					</li>
				{/each}
			</ul>
			{#if candidates.length > 0}
				<form method="POST" action="?/addAdmin" use:enhance class="mt-3">
					<input type="hidden" name="listId" value={list.id} />
					<select
						class="select w-full rounded-2xl select-sm"
						name="userId"
						required
						onchange={(event) => {
							if (event.currentTarget.value) event.currentTarget.form?.requestSubmit();
						}}
					>
						<option value="">{t(data.locale, 'lists.addAdmin')}</option>
						{#each candidates as member (member.id)}
							<option value={member.id}>{member.firstName}</option>
						{/each}
					</select>
				</form>
			{/if}
			<form method="POST" action="?/delete" use:enhance class="mt-3">
				<input type="hidden" name="listId" value={list.id} />
				<button class="text-sm font-semibold text-error underline"
					>{t(data.locale, 'lists.delete')}</button
				>
			</form>
		</article>
	{/each}
</section>
