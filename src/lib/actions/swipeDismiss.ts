/** Drag a bottom sheet down to dismiss. Attach to the sheet panel (not the backdrop). */
export function swipeDismiss(
	node: HTMLElement,
	opts: { onclose: () => void; threshold?: number }
) {
	let onclose = opts.onclose;
	const threshold = () => opts.threshold ?? 110;
	let startY = 0;
	let dy = 0;
	let tracking = false;

	function isInteractive(target: EventTarget | null) {
		if (!(target instanceof Element)) return false;
		return Boolean(target.closest('button, a, input, textarea, select, label, [role="button"]'));
	}

	function onStart(e: TouchEvent) {
		if (e.touches.length !== 1) return;
		if (isInteractive(e.target)) {
			tracking = false;
			return;
		}
		const t = e.touches[0];
		startY = t.clientY;
		dy = 0;
		tracking = true;
		node.style.transition = 'none';
	}

	function onMove(e: TouchEvent) {
		if (!tracking || e.touches.length !== 1) return;
		dy = Math.max(0, e.touches[0].clientY - startY);
		node.style.transform = `translateY(${dy}px)`;
		if (dy > 8) e.preventDefault();
	}

	function onEnd() {
		if (!tracking) return;
		tracking = false;
		node.style.transition = 'transform 200ms ease';
		if (dy >= threshold()) {
			node.style.transform = `translateY(100%)`;
			window.setTimeout(() => {
				node.style.transform = '';
				node.style.transition = '';
				onclose();
			}, 180);
		} else {
			node.style.transform = '';
			window.setTimeout(() => {
				node.style.transition = '';
			}, 200);
		}
		dy = 0;
	}

	node.addEventListener('touchstart', onStart, { passive: true });
	node.addEventListener('touchmove', onMove, { passive: false });
	node.addEventListener('touchend', onEnd);
	node.addEventListener('touchcancel', onEnd);

	return {
		update(next: { onclose: () => void; threshold?: number }) {
			onclose = next.onclose;
			opts = next;
		},
		destroy() {
			node.removeEventListener('touchstart', onStart);
			node.removeEventListener('touchmove', onMove);
			node.removeEventListener('touchend', onEnd);
			node.removeEventListener('touchcancel', onEnd);
			node.style.transform = '';
			node.style.transition = '';
		}
	};
}
