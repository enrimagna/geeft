<script lang="ts">
	let { title }: { title: string } = $props();
</script>

<div class="flex flex-col items-center px-6 py-16 text-center">
	<svg class="h-28 w-28" style="animation: wiggle 3s ease-in-out infinite" viewBox="0 0 128 128">
		<rect width="128" height="128" rx="28" fill="#FAF7F2" />
		<rect x="22" y="40" width="84" height="68" rx="14" fill="#5C6B7A" />
		<rect x="58" y="40" width="12" height="68" fill="#E8A87C" />
		<rect x="22" y="68" width="84" height="12" fill="#E8A87C" />
		<path
			d="M46 28 C46 14, 58 14, 64 28 C70 14, 82 14, 82 28"
			fill="none"
			stroke="#E8A87C"
			stroke-width="8"
			stroke-linecap="round"
		/>
		<circle cx="64" cy="30" r="6" fill="#FAF7F2" />
	</svg>
	<p class="mt-4 max-w-xs font-display text-xl leading-snug text-ink">{title}</p>
</div>
