const fs = require('fs');
const path = require('../../lib/path2');
const { notStrictEqual } = require('assert');
const { LINUX_AUTOSTART_DIR, LINUX_APPIMAGE_DIR } = require('../../lib/Constants');
const BaseModule = require('../../lib/BaseModule');
const Env = require('../../env');

// WARNING: THIS SCRIPT WILL CHANGE THE MACHINE'S STARTUP BEHAVIOUR.
// TO DISABLE REMOVE .desktop FILE
// WILL TAKE EFFECT ONLY ON BUILD MODE, NOT ON DEV MODE
class Autostarter extends BaseModule {
	MODULE_NAME = 'autostart';
	autostart_function;
	do_autostart;

	setup_linux() {
		if (this.getAppData().autostart && !Env.DEBUG_MODE)
		{
			if (!fs.existsSync(LINUX_APPIMAGE_DIR))
				throw new BaseModule.LoadError("desktop file does not exist")
			try {
				fs.cpSync(
					LINUX_APPIMAGE_DIR,
					LINUX_AUTOSTART_DIR,
					{recursive: true, force: true}
				);
			}
			catch (e) {
				throw new BaseModule.LoadError(`${e}`);
			}
		}
	}

	setup_windows() {
		app.setLoginItemSettings({
			openAtLogin: true,
		});
	}
}

module.exports = Autostarter;
