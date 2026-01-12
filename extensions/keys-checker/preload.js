const { contextBridge, ipcRenderer } = require('electron');
const ipcChannel = require('../../lib/icpChannel.js');
const BasePreload = require('../../lib/BasePreload.js');

class TouchUtils_preload extends BasePreload {
	MODULE_NAME = 'keys-checker';

	contextbridge_expose = {
		electronAPI: {
			getExtraInfo: () => ipcChannel.sendSignalToMain('get-info'),
			getLocalKey: () => ipcChannel.sendSignalToMain('get-info'),
		},
	};

	setup() {}
}

module.exports = TouchUtils_preload;
