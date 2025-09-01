const { ipcMain } = require('electron');

// Sample Module. Plase copy-paste this file into new module's main folder
class LocalKeysCheck extends require('../lib/BaseModule')
{
    MODULE_NAME = "keys-checker";
    term_id;
    term_key;

    setup()
    {
        ipcMain.handle('get-key', async () => await this.getLocalKey());
        this.term_id = this.__conf.terminal_id;
        this.term_key = this.__conf.terminal_key;
        this.log('Loaded local keys:', {key:this.term_key, id: this.term_id})
    }

    
	async getLocalKey()
	{
        this.log(this.tab.webContents.getURL(), 'is trying to access local keys info');
		return {terminal_key: this.term_key, terminal_id: this.term_id};
	}
}

module.exports = LocalKeysCheck;