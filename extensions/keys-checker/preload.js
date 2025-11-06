const { contextBridge, ipcRenderer } = require('electron');
const ipcChannel = require('../../lib/icpChannel.js');

class TouchUtils_preload extends require('../../lib/BasePreload.js')
{
    MODULE_NAME = "keys-checker";
	contextbridge_expose = {
			'electronAPI': {
				getLocalKey: () => ipcRenderer.invoke('get-key')
			}
		};

	getKeyPlease()
	{
		ipcChannel.sendSignalToMain('get-key').then(keys => {return keys.machine_id});
	}

	setup() {}
}

module.exports = TouchUtils_preload
