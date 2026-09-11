/** Drag a bottom sheet down to dismiss. Attach to the sheet panel (not the backdrop). */
export function swipeDismiss(
	node: HTMLElement,
	opts: { onclose: () => void; threshold?: number }
) {
	let onclose = opts.onclose;
	const threshold = () => opts.threshold ?? 72;
	let startY = 0;
	let dy = 0;
	let tracking = false;
	let armed = false;
	let fromHandle = false;
	let pointerId: number | null = null;

	function scroller(): HTMLElement | null {
		return node.querySelector<HTMLElement>('[data-sheet-scroll]');
	}

	function hitHandle(target: EventTarget | null) {
		return target instanceof Element && Boolean(target.closest('[data-sheet-handle]'));
	}

	function shouldIgnore(target: EventTarget | null) {
		if (!(target instanceof Element)) return true;
		if (hitHandle(target)) return false;
		return Boolean(target.closest('button, a, input, textarea, select, label'));
	}

	function resetVisual() {
		node.style.transform = '';
		node.style.opacity = '';
		node.style.transition = '';
	}

	function onPointerDown(e: PointerEvent) {
		if (e.button !== 0) return;
		if (shouldIgnore(e.target)) return;

		const scrollEl = scroller();
		fromHandle = hitHandle(e.target);
		if (!fromHandle && scrollEl && scrollEl.scrollTop > 0) return;

		armed = true;
		tracking = false;
		startY = e.clientY;
		dy = 0;
		pointerId = e.pointerId;
		try {
			node.setPointerCapture(e.pointerId);
		} catch {
			/* ignore */
		}
	}

	function onPointerMove(e: PointerEvent) {
		if (!armed || e.pointerId !== pointerId) return;
		const delta = e.clientY - startY;

		if (!tracking) {
			if (delta < 10) return;
			const scrollEl = scroller();
			if (!fromHandle && scrollEl && scrollEl.scrollTop > 0) {
				armed = false;
				return;
			}
			tracking = true;
			node.style.transition = 'none';
		}

		dy = Math.max(0, delta);
		node.style.transform = `translateY(${dy}px)`;
		node.style.opacity = String(Math.max(0.5, 1 - dy / 320));
		if (dy > 6) e.preventDefault();
	}

	function onPointerUp(e: PointerEvent) {
		if (pointerId !== null && e.pointerId !== pointerId) return;
		const shouldClose = tracking && dy >= threshold();
		armed = false;
		tracking = false;
		pointerId = null;
		fromHandle = false;

		if (!shouldClose && dy === 0) {
			resetVisual();
			return;
		}

		node.style.transition = 'transform 220ms ease, opacity 220ms ease';
		if (shouldClose) {
			node.style.transform = 'translateY(110%)';
			node.style.opacity = '0';
			window.setTimeout(() => {
				resetVisual();
				onclose();
			}, 200);
		} else {
			node.style.transform = '';
			node.style.opacity = '';
			window.setTimeout(() => {
				node.style.transition = '';
			}, 220);
		}
		dy = 0;
	}

	node.addEventListener('pointerdown', onPointerDown);
	node.addEventListener('pointermove', onPointerMove, { passive: false });
	node.addEventListener('pointerup', onPointerUp);
	node.addEventListener('pointercancel', onPointerUp);

	return {
		update(next: { onclose: () => void; threshold?: number }) {
			onclose = next.onclose;
			opts = next;
		},
		destroy() {
			node.removeEventListener('pointerdown', onPointerDown);
			node.removeEventListener('pointermove', onPointerMove);
			node.removeEventListener('pointerup', onPointerUp);
			node.removeEventListener('pointercancel', onPointerUp);
			resetVisual();
		}
	};
}
