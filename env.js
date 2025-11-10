// Here be only static defined variables used for debugging purposes

class Env
{
	static DEBUG_MODE = true;
	static VERBOSE = this.DEBUG_MODE && true;
	static ALWAYS_RECONFIGURE_EXTENSIONS = true;
	static CREATE_CONF_FOR_DISABLED_EXTENSIONS = true;
	static CLEAR_CONFS_ON_RESTART = true;
	static WEBVIEW_DEFAULT_PREFERENCES = {
				contextIsolation: true,
				nodeIntegration: false,
				sandbox: false
			};
}

module.exports = Env;