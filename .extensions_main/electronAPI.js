const { app, ipcMain } = require('electron');
const fs = require('fs');

// Sample Module. Plase copy-paste this file into new module's main folder
class ElectronAPI extends require('../lib/BaseModule')
{
    MODULE_NAME = "electronAPI";    // MUST be the same as file name (required to access conf file)

    //// Constructor trace, please leave commented, unless necessary.
    // constructor(window, tab) { super(window, tab); }

    // Setup code here. This function is called in BaseModule's constructor.
    setup()
	{
		ipcMain.handle('select-file', async () => await this.selectFile());
		ipcMain.handle('read-file', async (event, path) => await this.readFile(path));
		// ipcMain.handle('get-key', async () => await this.getLocalKey()); --> moved in keys-checker.js
		
		app.commandLine.appendSwitch('touch-events', 'enabled');
		// app.commandLine.appendSwitch('enable-pointer-events');
	}

	async readFile(path)
	{
		console.log("reading file");
		try {
			return fs.readFileSync(path, 'utf-8');
		} catch (err) {
			console.error(err);
			return null;
		}
	}

}

module.exports = ElectronAPI;