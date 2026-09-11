/** App chrome: hide bottom nav while sheets/dialogs are open. */
class Chrome {
	overlayCount = $state(0);

	get overlayOpen() {
		return this.overlayCount > 0;
	}

	/** Call while an overlay is shown; returns a disposer. */
	acquire() {
		this.overlayCount += 1;
		return () => {
			this.overlayCount = Math.max(0, this.overlayCount - 1);
		};
	}
}

export const chrome = new Chrome();
