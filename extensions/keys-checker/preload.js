const { contextBridge, ipcRenderer } = require('electron');
const ipcChannel = require('../../lib/icpChannel.js');

class TouchUtils_preload extends require('../../lib/BasePreload.js')
{
	getKeyPlease()
	{
		ipcChannel.sendSignalToMain('get-key').then(keys => {return keys.machine_id});
	}

	setup()
	{
		contextBridge.exposeInMainWorld('electronAPI', {
			readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
			getLocalKey: () => ipcRenderer.invoke('get-key'),
		});
	}
}

module.exports = TouchUtils_preload
