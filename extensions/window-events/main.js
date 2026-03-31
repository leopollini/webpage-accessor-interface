const { checkActiveModules } = require('../../main');
const TabsManager = require('../../lib/TabsManager');
const Toolbar = require('../toolbar/main');
const BaseModule = require('../../lib/BaseModule');
const { app } = require('electron');

class WindowSetup extends BaseModule {
	MODULE_NAME = 'window-events'; // MUST be the same as file name (required to access conf file)

	on_new_tab_created(newTab) {
		if (this.__conf.enable_shortcuts == true) {
			this.newCtrlShortcut('f', () => this.ctrlF(this.window), newTab);
			this.newCtrlShortcut('x', () => this.ctrlX(this.window), newTab);
			this.newCtrlShortcut('d', (tab) => this.ctrlD(tab), newTab);
			this.newCtrlShortcut('w', (tab) => this.ctrlW(tab), newTab);
			this.newCtrlShortcut('q', (tab) => this.ctrlQ(tab), newTab);

			this.log('shortcuts have been registered');
		}
	}

	ctrlF(window) {
		window?.setFullScreen(!window?.isFullScreen());
		TabsManager.resized();
	}
	ctrlX() {
		checkActiveModules();
	}
	ctrlD(tab) {
		if (tab.devtools_detach) tab.webContents.openDevTools({ mode: 'detach' });
		else tab.webContents.toggleDevTools();
	}
	ctrlW(tab) {
		console.log('pressed ctrl+w on tab', tab?.tab_id, 'closing', TabsManager.getActiveTab()?.tab_id);
		if (new Toolbar().isActive()) new Toolbar().requestCloseTab(TabsManager.getActiveTab());
	}
	ctrlQ(tab) {
		console.log('pressed ctrl+q on tab', tab?.tab_id, 'closing', TabsManager.getActiveTab()?.tab_id);
		app.quit();
	}

	setup() {
		if (this.__conf.start_with_dev_tools == true && this.tab) this.tab.webContents.toggleDevTools();
	}
}

module.exports = WindowSetup;
