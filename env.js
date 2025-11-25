// Here be only static defined variables used for debugging purposes

class Env
{
	static IS_EXECUTABLE = process.env.APPIMAGE;
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