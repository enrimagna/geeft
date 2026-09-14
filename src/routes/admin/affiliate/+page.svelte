<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
	let editingId = $state<string | null>(null);
	let showCreate = $state(false);

	function networkById(id: string) {
		return data.networks.find((n) => n.id === id) ?? null;
	}
</script>

<div class="mx-auto max-w-5xl px-4 pt-16 pb-16">
	<header class="mb-8">
		<p class="text-xs font-bold tracking-[0.2em] text-slate uppercase">Admin</p>
		<h1 class="font-display text-3xl font-semibold">Affiliate</h1>
		<p class="mt-1 text-sm text-slate">
			Silent redirects. Tags stay server-side. Flag off = passthrough via /r/*.
		</p>
	</header>

	{#if form && 'message' in form && form.message}
		<p class="mb-4 text-sm text-error">{form.message}</p>
	{/if}

	<section class="mb-10 rounded-[1.4rem] border border-white/80 bg-white/80 p-5 shadow-sm">
		<h2 class="font-display text-xl font-semibold">Flag</h2>
		<p class="mt-1 text-sm text-slate">
			Se off, <code class="text-xs">/r/*</code> fa solo passthrough sull’URL originale.
		</p>
		<p class="mt-2 text-xs text-slate">
			Click 7g: {data.totals.clicks7} · Click 30g: {data.totals.clicks30}
		</p>
		<form method="POST" action="?/toggle" use:enhance class="mt-4 flex items-center gap-3">
			<input type="hidden" name="affiliate_enabled" value={data.affiliateEnabled ? '0' : '1'} />
			<span class="text-sm font-semibold">
				Affiliate {data.affiliateEnabled ? 'attivo' : 'disattivo'}
			</span>
			<button class="pressable btn btn-sm rounded-xl btn-primary" type="submit">
				{data.affiliateEnabled ? 'Disattiva' : 'Attiva'}
			</button>
		</form>
	</section>

	<section class="mb-10 rounded-[1.4rem] border border-white/80 bg-white/80 p-5 shadow-sm">
		<div class="flex items-center justify-between gap-3">
			<h2 class="font-display text-xl font-semibold">Networks</h2>
			<button
				type="button"
				class="pressable btn btn-sm rounded-xl btn-secondary"
				onclick={() => (showCreate = !showCreate)}
			>
				{showCreate ? 'Chiudi' : 'Aggiungi'}
			</button>
		</div>

		{#if showCreate}
			<form method="POST" action="?/create" use:enhance class="mt-4 grid gap-3 md:grid-cols-2">
				<label class="block text-sm font-semibold">
					Nome
					<input class="input mt-1 w-full rounded-2xl input-sm" name="name" required />
				</label>
				<label class="block text-sm font-semibold">
					Key (immutable)
					<input class="input mt-1 w-full rounded-2xl input-sm" name="key" required />
				</label>
				<label class="block text-sm font-semibold md:col-span-2">
					Host patterns (uno per riga)
					<textarea
						class="textarea mt-1 w-full rounded-2xl"
						name="hostPatterns"
						rows="3"
						required
						placeholder="amazon.it&#10;www.amazon.it"
					></textarea>
				</label>
				<label class="block text-sm font-semibold">
					Tag param
					<input class="input mt-1 w-full rounded-2xl input-sm" name="tagParam" value="tag" />
				</label>
				<label class="block text-sm font-semibold">
					Tag value
					<input
						class="input mt-1 w-full rounded-2xl input-sm"
						type="password"
						name="tagValue"
						autocomplete="off"
					/>
				</label>
				<label class="block text-sm font-semibold">
					Priority
					<input
						class="input mt-1 w-full rounded-2xl input-sm"
						type="number"
						name="priority"
						value="100"
					/>
				</label>
				<label class="flex items-center gap-2 pt-6 text-sm font-semibold">
					<input type="checkbox" name="enabled" value="1" class="checkbox checkbox-sm" />
					Enabled
				</label>
				<label class="block text-sm font-semibold md:col-span-2">
					Extra params JSON
					<input class="input mt-1 w-full rounded-2xl input-sm" name="extraParams" placeholder="{}" />
				</label>
				<button class="pressable btn rounded-2xl btn-primary md:col-span-2" type="submit"
					>Crea</button
				>
			</form>
		{/if}

		<div class="mt-4 overflow-x-auto">
			<table class="table table-sm">
				<thead>
					<tr>
						<th>Name</th>
						<th>Key</th>
						<th>Hosts</th>
						<th>Tag</th>
						<th>On</th>
						<th>Prio</th>
						<th>7g</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.networks as network (network.id)}
						<tr>
							<td>{network.name}</td>
							<td><code class="text-xs">{network.key}</code></td>
							<td>
								<div class="flex flex-wrap gap-1">
									{#each network.hostPatterns as host}
										<span class="badge badge-ghost badge-sm">{host}</span>
									{/each}
								</div>
							</td>
							<td><code class="text-xs">{network.tagMasked}</code></td>
							<td>{network.enabled ? 'yes' : 'no'}</td>
							<td>{network.priority}</td>
							<td>{network.clicks7}</td>
							<td class="space-x-1 whitespace-nowrap">
								<button
									type="button"
									class="btn btn-ghost btn-xs"
									onclick={() => (editingId = editingId === network.id ? null : network.id)}
									>Modifica</button
								>
								{#if network.enabled}
									<form method="POST" action="?/disable" use:enhance class="inline">
										<input type="hidden" name="id" value={network.id} />
										<button class="btn btn-ghost btn-xs" type="submit">Disabilita</button>
									</form>
								{/if}
							</td>
						</tr>
						{#if editingId === network.id}
							{@const current = networkById(network.id)}
							{#if current}
								<tr>
									<td colspan="8">
										<form
											method="POST"
											action="?/update"
											use:enhance
											class="grid gap-3 rounded-2xl bg-base-200/40 p-4 md:grid-cols-2"
										>
											<input type="hidden" name="id" value={current.id} />
											<label class="block text-sm font-semibold">
												Nome
												<input
													class="input mt-1 w-full rounded-2xl input-sm"
													name="name"
													value={current.name}
													required
												/>
											</label>
											<label class="block text-sm font-semibold">
												Key
												<input
													class="input mt-1 w-full rounded-2xl input-sm"
													value={current.key}
													disabled
												/>
											</label>
											<label class="block text-sm font-semibold md:col-span-2">
												Host patterns
												<textarea
													class="textarea mt-1 w-full rounded-2xl"
													name="hostPatterns"
													rows="3"
													required>{current.hostPatterns.join('\n')}</textarea
												>
											</label>
											<label class="block text-sm font-semibold">
												Tag param
												<input
													class="input mt-1 w-full rounded-2xl input-sm"
													name="tagParam"
													value={current.tagParam}
												/>
											</label>
											<label class="block text-sm font-semibold">
												Tag value
												<input
													class="input mt-1 w-full rounded-2xl input-sm"
													type="password"
													name="tagValue"
													value={current.tagValue}
													autocomplete="off"
												/>
											</label>
											<label class="block text-sm font-semibold">
												Priority
												<input
													class="input mt-1 w-full rounded-2xl input-sm"
													type="number"
													name="priority"
													value={current.priority}
												/>
											</label>
											<label class="flex items-center gap-2 pt-6 text-sm font-semibold">
												<input
													type="checkbox"
													name="enabled"
													value="1"
													class="checkbox checkbox-sm"
													checked={current.enabled}
												/>
												Enabled
											</label>
											<label class="block text-sm font-semibold md:col-span-2">
												Extra params JSON
												<input
													class="input mt-1 w-full rounded-2xl input-sm"
													name="extraParams"
													value={current.extraParams}
												/>
											</label>
											<button class="pressable btn rounded-2xl btn-primary md:col-span-2" type="submit"
												>Salva</button
											>
										</form>
									</td>
								</tr>
							{/if}
						{/if}
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="rounded-[1.4rem] border border-white/80 bg-white/80 p-5 shadow-sm">
		<h2 class="font-display text-xl font-semibold">Attività</h2>
		<p class="mt-1 text-sm text-slate">Ultime 50 click (niente query string / PII extra).</p>
		<div class="mt-4 overflow-x-auto">
			<table class="table table-sm">
				<thead>
					<tr>
						<th>Data</th>
						<th>Gift</th>
						<th>Host</th>
						<th>Rewritten</th>
						<th>Network</th>
						<th>User</th>
					</tr>
				</thead>
				<tbody>
					{#each data.recent as click (click.id)}
						<tr>
							<td class="text-xs whitespace-nowrap">{click.createdAt}</td>
							<td><code class="text-xs">{click.giftIdShort}</code></td>
							<td class="text-xs">{click.host}</td>
							<td>{click.rewritten ? 'sì' : 'no'}</td>
							<td class="text-xs">{click.network}</td>
							<td class="text-xs">{click.userIdShort ?? '—'}</td>
						</tr>
					{/each}
					{#if data.recent.length === 0}
						<tr>
							<td colspan="6" class="text-sm text-slate">Nessun click ancora.</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</section>
</div>
