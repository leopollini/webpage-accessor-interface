const BaseModule = require('../../lib/BaseModule.js');
const ipcChannel = require('../../lib/icpChannel.js');

class Autoupdate_preload extends BaseModule {
	MODULE_NAME = 'autoupdate';
	update_check_timer = null;
	update_click_timeout;

	setup() {
		if (this.__conf.update_mode.mode == 'long_press') {
			this.update_click_timeout = this.__conf.update_mode.duration;

			// bad check: frequent false positives.
			window?.addEventListener('pointerdown', () => {
				if (!this.update_check_timer)
					this.update_check_timer = setTimeout(() => {
						this.updateCheckRequest();
					}, this.__conf.update_mode.duration * 1000);
			});
			window?.addEventListener('pointerup', () => {
				if (this.update_check_timer) {
					clearTimeout(this.update_check_timer);
					this.update_check_timer = null;
				}
			});
		}
	}

	updateCheckRequest() {
		this.warn('Update check requested!');
		ipcChannel.sendSignalToMain('usr-check-for-updates');
	}
}

module.exports = Autoupdate_preload;
