<script lang="ts">
	const gifts = [
		{ top: '8%', left: '6%', delay: '0s', size: 46 },
		{ top: '22%', left: '78%', delay: '-2s', size: 38 },
		{ top: '58%', left: '12%', delay: '-4s', size: 52 },
		{ top: '72%', left: '70%', delay: '-1s', size: 34 },
		{ top: '86%', left: '28%', delay: '-5s', size: 42 }
	];
</script>

<div class="living-bg" aria-hidden="true">
	<div class="blob blob-peach"></div>
	<div class="blob blob-slate"></div>
	<div class="blob blob-mist"></div>
	{#each gifts as g (g.top + g.left)}
		<svg
			class="floater"
			style="top:{g.top};left:{g.left};width:{g.size}px;animation-delay:{g.delay}"
			viewBox="0 0 128 128"
		>
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
		</svg>
	{/each}
</div>
