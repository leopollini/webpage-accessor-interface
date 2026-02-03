const { ipcRenderer } = require('electron');
const BasePreload = require('../../lib/BasePreload.js');
const { getFavIco } = require('../../lib/utils.js');

module.exports = class Toolbar_preload extends BasePreload {
	MODULE_NAME = 'toolbar';
	contextbridge_expose = {
		manage_tabs: {
			createdTab: (url) => ipcRenderer.invoke('created-tab', url),
			switchTab: (index) => ipcRenderer.invoke('switch-tab', index),
			closeTab: (index) => ipcRenderer.invoke('closed-tab', index),
			onDoCreateTab: (cb) => ipcRenderer.on('create-tab', (_, data) => cb(data)),
			onDoCloseTab: (cb) => ipcRenderer.on('close-tab', (_, data) => cb(data)),
			onRenameTab: (cb) => ipcRenderer.on('rename-tab', (_, data) => cb(data)),
			onBackgroundColorUpdated: (cb) => ipcRenderer.on('update-bg', (_, data) => cb(data)),
			getFavicoUrl: (host) => getFavIco(host),
		},
	};

	setup() {}
}