/** App chrome: hide bottom nav while sheets/dialogs are open. */
import { untrack } from 'svelte';

class Chrome {
	overlayCount = $state(0);

	get overlayOpen() {
		return this.overlayCount > 0;
	}

	/**
	 * Call while an overlay is shown; returns a disposer.
	 * Mutations are untracked so $effect callers that invoke acquire()
	 * do not re-subscribe to overlayCount and hit effect_update_depth_exceeded.
	 */
	acquire() {
		untrack(() => {
			this.overlayCount += 1;
		});
		return () => {
			untrack(() => {
				this.overlayCount = Math.max(0, this.overlayCount - 1);
			});
		};
	}
}

export const chrome = new Chrome();
