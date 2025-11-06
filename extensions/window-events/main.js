const {checkActiveModules} = require('../../main');
const Env = require('../../env');

class WindowSetup extends require('../../lib/BaseModule')
{
	MODULE_NAME = "window-events";    // MUST be the same as file name (required to access conf file)

	onNewTabCreated()
	{
		if (this.__conf.enable_shortcuts == true)
		{
			this.newCtrlShortcut('f', () => { this.window.setFullScreen(!this.window.isFullScreen()); });
			this.newCtrlShortcut('x', () => { checkActiveModules(); });
			this.newCtrlShortcut('w', () => { this.window.close(); });
			this.newCtrlShortcut('d', () => this.tab.webContents.toggleDevTools());
			this.log('shortcuts have been registered');
		}
	}

	setup()
	{
		if (this.__conf.start_with_dev_tools == true && this.tab)
			this.tab.webContents.toggleDevTools();

		if (this.getAppData().fullscreen == true) this.window.setFullScreen(true);
	}
}

module.exports = WindowSetup;
