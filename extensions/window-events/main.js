const { app, globalShortcut } = require('electron');
const {checkActiveModules} = require('../../main');
const Env = require('../../env');

// Sample Module. Plase copy-paste this file into new module's main folder
class WindowSetup extends require('../../lib/BaseModule')
{
	MODULE_NAME = "window-events";    // MUST be the same as file name (required to access conf file)

	//// Constructor trace, please leave commented, unless necessary.
	// constructor(window, tab) { super(window, tab); }

	// Setup code here. This function is called in BaseModule's constructor.
	setup()
	{
        this.window.on('resize', () => {
			if (this.window.isFullScreen()) return ;
            this.tab.setBounds({x: 0, y: 0  , height: this.window.getContentBounds().height, width: this.window.getContentBounds().width});
			if (Env.VERBOSE)
				this.logWindowDimensions('resize');
        });
        this.window.on('enter-full-screen', () => {
            this.tab.setBounds({x: 0, y: 0  , height: this.window.getContentBounds().height, width: this.window.getContentBounds().width});
			if (Env.VERBOSE)
				this.logWindowDimensions('enter fullscreen');
        });
        this.window.on('leave-full-screen', () => {
            this.tab.setBounds({x: 0, y: 0  , height: this.window.getContentBounds().height, width: this.window.getContentBounds().width});
			if (Env.VERBOSE)
				this.logWindowDimensions('leave fullscreen');
        });
	
		if (this.__conf.enable_shortcuts == true)
		{
			globalShortcut.register('ctrl+f', () => {
				this.window.setFullScreen(!this.window.isFullScreen());
			});
			globalShortcut.register('ctrl+d', () => {
				this.tab.webContents.toggleDevTools();
			});
			globalShortcut.register('ctrl+x', () => {
				checkActiveModules();
			});
			globalShortcut.register('ctrl+w', () => {
				this.window.close();
			});
			// globalShortcut.register('esc', () => {
			// 	this.window.close();
			// });
		}

		if (this.getAppData().fullscreen == true) this.window.setFullScreen(true);
	}

	logWindowDimensions(operation = '')
	{
		this.log(operation + ' Bounds:', this.window.getContentBounds());
		this.log(operation + ' Size:', this.window.getContentSize());
	}
}

module.exports = WindowSetup;
