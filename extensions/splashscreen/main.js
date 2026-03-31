const { WebContentsView } = require('electron');
const TabsManager = require('../../lib/TabsManager');
const Env = require('../../env');
const url = require('url');

// Sample Module. Plase copy-paste this file into new module's main folder
module.exports = class Splashscreen extends require('../../lib/BaseModule') {
	MODULE_NAME = 'splashscreen'; // MUST be the same as the 'extension' field in config.json
	// required_modules = ['window-events'];

	is_splashscreen = false;
	inputed = true;
	splash = null;

	setup() {
		this.splash = new WebContentsView({
			webPreferences: {
				...Env.WEBVIEW_DEFAULT_PREFERENCES,
			},
		});

		this.splash.tab_id = 'splashscreen';

		this.splash.webContents.loadURL(url.format(this.__conf.splash_url));
		this.splash.webContents.on('input-event', () => {
			if (this.is_splashscreen) this.removeSplash();
		});

		TabsManager.newTab(this.splash, 'splashscreen', false);

		// Actual splash screen activation time is between 3/4 of the timeout value and 3/2 of the timeout value
		setInterval(() => {
			if (this.is_splashscreen) return;
			if (Env.VERBOSE) this.log('splash_check', this.inputed);
			if (!this.inputed) this.setSplash();
			this.inputed = false;
		}, this.__conf.splash_timeout * 750);
	}

	on_new_tab_created(newTab) {
		newTab.webContents.on('input-event', (e, input) => {
			this.inputed = true;
		});
		this.log('listener set');
	}

	setSplash() {
		TabsManager.setTab('splashscreen', false);
		setTimeout(() => {
			this.is_splashscreen = true;
		}, 500);
	}

	removeSplash() {
		this.is_splashscreen = false;
		if (TabsManager.activeTabName == this.splash.tab_id) TabsManager.unsetTab();
	}
};
