import type { Action } from 'svelte/action';

/** Direct DOM click listener (not Svelte delegated onclick). */
export const onTap: Action<HTMLElement, () => void> = (node, fn) => {
	let current = fn;
	const run = (e: Event) => {
		e.preventDefault();
		e.stopPropagation();
		current();
	};
	node.addEventListener('click', run);
	return {
		update(next: () => void) {
			current = next;
		},
		destroy() {
			node.removeEventListener('click', run);
		}
	};
};
