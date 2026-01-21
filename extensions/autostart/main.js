const fs = require('fs');
const path = require('../../lib/path2');
const { notStrictEqual } = require('assert');
const { LINUX_AUTOSTART_DIR } = require('../../lib/Constants');
const BaseModule = require('../../lib/BaseModule');
const Env = require('../../env');

// WARNING: THIS SCRIPT WILL CHANGE THE MACHINE'S STARTUP BEHAVIOUR.
// TO DISABLE REMOVE .desktop FILE
// WILL TAKE EFFECT ONLY ON BUILD MODE, NOT ON DEV MODE
class Autostarter extends BaseModule {
	MODULE_NAME = 'autostart';

	setup_linux() {
		if (this.getAppData().autostart === true && !Env.DEBUG_MODE)
		{
			if (!fs.existsSync(Env.LINUX_DESKTOPFILE_PATH))
				throw new BaseModule.LoadError("desktop file does not exist")
			try {
			fs.cpSync(
					Env.LINUX_DESKTOPFILE_PATH,
					LINUX_AUTOSTART_DIR,
					{recursive: true, force: true}
				);
			}
			catch (e) {
				throw new BaseModule.LoadError(`${e}`);
			}
			this.log("Autostart set!");
		}
		if (this.getAppData().autostart === false && fs.existsSync(Env.LINUX_DESKTOPFILE_PATH)) {
			try {
				fs.rmSync(LINUX_AUTOSTART_DIR);
			}
			catch (e) {
				throw new BaseModule.LoadError(`${e}`);
			}
			this.log("Autostart unset!");
		}
	}

	setup_windows() {
		app.setLoginItemSettings({
			openAtLogin: true,
		});
	}
}

module.exports = Autostarter;
