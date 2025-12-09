// Here be only static defined variables used for debugging purposes
const { app } = require('electron');

class Env
{
	static ROOT_LOCATION;		// set in main.js
	static IS_EXECUTABLE;		// set in main.js
	static DEBUG_MODE = true;
	static get VERBOSE() {return this.DEBUG_MODE};
	static ALWAYS_RECONFIGURE_EXTENSIONS = false;
	static CREATE_CONF_FOR_DISABLED_EXTENSIONS = true;
	static CLEAR_CONFS_ON_RESTART = !this.IS_EXECUTABLE;
	static WEBVIEW_DEFAULT_PREFERENCES = {
				contextIsolation: true,
				nodeIntegration: false,
				sandbox: false
			};
}

module.exports = Env;