// Here be only static defined variables used for debugging purposes
const { app } = require('electron');

const FORCE_EXE = false;
const FORCE_VERBOSE = true

class Env {
	static ROOT_LOCATION; // set in main.js
	static IS_EXECUTABLE = app?.isPackaged || FORCE_EXE;
	static DEBUG_MODE = !this.IS_EXECUTABLE && true;
	static get VERBOSE() {
		return this.DEBUG_MODE || FORCE_VERBOSE;
	}
	static ALWAYS_RECONFIGURE_EXTENSIONS = false;
	static CREATE_CONF_FOR_DISABLED_EXTENSIONS = true;
	static CLEAR_CONFS_ON_RESTART =
		!this.IS_EXECUTABLE && this.DEBUG_MODE || 'ask';
	static WEBVIEW_DEFAULT_PREFERENCES = {
		contextIsolation: true,
		nodeIntegration: false,
		sandbox: false,
	};
}

module.exports = Env;
