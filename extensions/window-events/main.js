const {checkActiveModules} = require('../../main');
const Env = require('../../env');
const TabsManager = require('../../lib/TabsManager');
const Toolbar = require('../toolbar/main');
const BaseModule = require('../../lib/BaseModule');

class WindowSetup extends BaseModule
{
	MODULE_NAME = "window-events";    // MUST be the same as file name (required to access conf file)

	onNewTabCreated(newTab)
	{
		if (this.__conf.enable_shortcuts == true)
		{
			this.newCtrlShortcut('f', () => this.ctrlF(this.window), newTab);
			this.newCtrlShortcut('x', () => this.ctrlX(this.window), newTab);
			this.newCtrlShortcut('d', (tab) => this.ctrlD(tab), newTab);
			this.newCtrlShortcut('w', (tab) => this.ctrlW(tab), newTab);

			this.log('shortcuts have been registered');
		}
	}

	ctrlF(window)
	{
		window.setFullScreen(!window.isFullScreen()); 
	}
	ctrlX()
	{
		checkActiveModules();
	}
	ctrlD(tab)
	{
		tab.webContents.toggleDevTools()
	}
	ctrlW(tab)
	{
		console.log("pressed ctrl+w on tab", tab.tab_id, 'closing', TabsManager.getActiveTab().tab_id)
		Toolbar.requestCloseTab(TabsManager.getActiveTab());
	}

	setup()
	{
		if (this.__conf.start_with_dev_tools == true && this.tab)
			this.tab.webContents.toggleDevTools();

		if (this.getAppData().fullscreen == true) this.window.setFullScreen(true);
	}
}

module.exports = WindowSetup;
