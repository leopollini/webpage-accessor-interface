const { ipcMain, remote, dialog } = require('electron');
const { machineIdSync } = require("node-machine-id");
const ipcChannel = require('../../lib/icpChannel');

// Sample Module. Plase copy-paste this file into new module's main folder
class LocalKeysCheck extends require('../../lib/BaseModule')
{
    MODULE_NAME = "keys-checker";
    machine_id = null;
    real_machine_id;
    

    setup()
    {
        ipcChannel.newMainHandler('get-key', async () => await this.getLocalKey());

        const id = machineIdSync();
        this.real_machine_id = machineIdSync(false);

        this.machine_id = this.__conf.custom_id || id;
        
        this.log('Loaded local id:', this.machine_id);

        this.askStructureId();
    }
    
	async getLocalKey()
	{
        this.log(this.tab.webContents.getURL(), 'is trying to access local keys info');
		return {machine_id: this.machine_id, structure_id: this.__conf.structure_id};
	}

    askStructureId()
    {
        if (!this.__conf.structure_id)
        dialog.showMessageBox(this.window, {
            type: 'info',
            title: 'Set structure id',
            message: `Please set the app's structure id in ${this.getAppDataDir() + this.MODULE_NAME + '.json'}`,
            buttons: ['Ok']
        })
    }
}

module.exports = LocalKeysCheck;