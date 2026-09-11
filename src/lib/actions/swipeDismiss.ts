/** Drag a bottom sheet down to dismiss. Attach to the sheet panel (not the backdrop). */
export function swipeDismiss(
	node: HTMLElement,
	opts: { onclose: () => void; threshold?: number }
) {
	let onclose = opts.onclose;
	const threshold = () => opts.threshold ?? 100;
	let startY = 0;
	let dy = 0;
	let tracking = false;
	let pointerId: number | null = null;

	function scrollParent(): HTMLElement | null {
		return node.querySelector<HTMLElement>('[data-sheet-scroll]') ?? node;
	}

	function isInteractive(target: EventTarget | null) {
		if (!(target instanceof Element)) return false;
		return Boolean(
			target.closest('button, a, input, textarea, select, label, [role="button"]')
		);
	}

	function begin(clientY: number, id: number, target: EventTarget | null) {
		if (isInteractive(target)) {
			tracking = false;
			return;
		}
		const scroller = scrollParent();
		if (scroller && scroller.scrollTop > 0) {
			tracking = false;
			return;
		}
		startY = clientY;
		dy = 0;
		tracking = true;
		pointerId = id;
		node.style.transition = 'none';
	}

	function move(clientY: number, e: Event) {
		if (!tracking) return;
		dy = Math.max(0, clientY - startY);
		node.style.transform = `translateY(${dy}px)`;
		node.style.opacity = String(Math.max(0.45, 1 - dy / 280));
		if (dy > 8) e.preventDefault();
	}

	function end() {
		if (!tracking) return;
		tracking = false;
		pointerId = null;
		node.style.transition = 'transform 200ms ease, opacity 200ms ease';
		if (dy >= threshold()) {
			node.style.transform = 'translateY(110%)';
			node.style.opacity = '0';
			window.setTimeout(() => {
				node.style.transform = '';
				node.style.opacity = '';
				node.style.transition = '';
				onclose();
			}, 180);
		} else {
			node.style.transform = '';
			node.style.opacity = '';
			window.setTimeout(() => {
				node.style.transition = '';
			}, 200);
		}
		dy = 0;
	}

	function onPointerDown(e: PointerEvent) {
		if (e.button !== 0) return;
		begin(e.clientY, e.pointerId, e.target);
		if (tracking) {
			try {
				node.setPointerCapture(e.pointerId);
			} catch {
				/* ignore */
			}
		}
	}

	function onPointerMove(e: PointerEvent) {
		if (!tracking || e.pointerId !== pointerId) return;
		move(e.clientY, e);
	}

	function onPointerUp(e: PointerEvent) {
		if (e.pointerId !== pointerId && pointerId !== null) return;
		end();
	}

	node.addEventListener('pointerdown', onPointerDown);
	node.addEventListener('pointermove', onPointerMove);
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
			node.style.transform = '';
			node.style.opacity = '';
			node.style.transition = '';
		}
	};
}
