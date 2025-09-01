const { ipcMain } = require('electron');
const { machineIdSync } = require("node-machine-id");

// Sample Module. Plase copy-paste this file into new module's main folder
class LocalKeysCheck extends require('../lib/BaseModule')
{
    MODULE_NAME = "keys-checker";
    machine_id = null;
    real_machine_id;
    

    setup()
    {
        ipcMain.handle('get-key', async () => await this.getLocalKey());

        const id = machineIdSync();
        this.real_machine_id = machineIdSync(false);

        this.machine_id = this.__conf.custom_id || id;
        
        this.log('Loaded local id:', this.machine_id);
    }

    
	async getLocalKey()
	{
        this.log(this.tab.webContents.getURL(), 'is trying to access local keys info');
		return {machine_id: this.machine_id};
	}
}

module.exports = LocalKeysCheck;