const { app, globalShortcut } = require('electron');
const {checkActiveModules} = require('../main')

// Sample Module. Plase copy-paste this file into new module's main folder
class WindowSetup extends require('../lib/BaseModule')
{
	MODULE_NAME = "window-events";    // MUST be the same as file name (required to access conf file)

	//// Constructor trace, please leave commented, unless necessary.
	// constructor(window, tab) { super(window, tab); }

	// Setup code here. This function is called in BaseModule's constructor.
	setup()
	{
		this.requireDataConf();

        this.window.on('resize', () => {
			if (this.window.isFullScreen()) return ;
            this.tab.setBounds({x: 0, y: 0  , height: this.window.getContentBounds().height, width: this.window.getContentBounds().width});
			this.logWindowDimensions('resize');
        });
        this.window.on('enter-full-screen', () => {
            this.tab.setBounds({x: 0, y: 0  , height: this.window.getContentBounds().height, width: this.window.getContentBounds().width});
			this.logWindowDimensions('enter fullscreen');
        });
        this.window.on('leave-full-screen', () => {
            this.tab.setBounds({x: 0, y: 0  , height: this.window.getContentBounds().height, width: this.window.getContentBounds().width});
			this.logWindowDimensions('leave fullscreen');
        });

		globalShortcut.register('f', () => {
			this.window.setFullScreen(!this.window.isFullScreen());
		});
		globalShortcut.register('d', () => {
			this.tab.webContents.toggleDevTools();
		});
		globalShortcut.register('c', () => {
			checkActiveModules();
		});

		if (this.__data.fullscreen == true) this.window.setFullScreen(true);
	}

	logWindowDimensions(operation = '')
	{
		this.log(operation + ' Bounds:', this.window.getContentBounds());
		this.log(operation + ' Size:', this.window.getContentSize());
	}
}

module.exports = WindowSetup;
