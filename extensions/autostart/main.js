const { app } = require('electron');
const fs = require('fs');
const path = require('../../lib/path2');
const { LINUX_AUTOSTART_DIR } = require('../../lib/Constants');
const BaseModule = require('../../lib/BaseModule');
const Env = require('../../env');

// WARNING: THIS SCRIPT WILL CHANGE THE MACHINE'S STARTUP BEHAVIOUR.
// TO DISABLE REMOVE .desktop FILE
// WILL TAKE EFFECT ONLY ON BUILD MODE, NOT ON DEV MODE
class Autostarter extends BaseModule {
	MODULE_NAME = 'autostart';

	setup_linux() {
		this.createDesktopFile();

		if (this.getAppData().autostart === true && !Env.DEBUG_MODE) {
			if (!fs.existsSync(Env.LINUX_DESKTOPFILE_PATH))
				throw new BaseModule.LoadError('desktop file does not exist');
			try {
				fs.cpSync(Env.LINUX_DESKTOPFILE_PATH, LINUX_AUTOSTART_DIR, { recursive: true, force: true });
			} catch (e) {
				throw new BaseModule.LoadError(`${e}`);
			}
			this.log('Autostart set!');
		}
		if (this.getAppData().autostart === false && fs.existsSync(Env.LINUX_DESKTOPFILE_PATH)) {
			try {
				fs.rmSync(LINUX_AUTOSTART_DIR);
			} catch (e) {
				throw new BaseModule.LoadError(`${e}`);
			}
			this.log('Autostart unset!');
		}
	}

	setup_windows() {
		app.setLoginItemSettings({
			openAtLogin: true,
		});
	}

	createDesktopFile() {
		// Linux only
		if (!Env.IS_EXECUTABLE || !process.env.APPIMAGE) return;

		Env.LINUX_DESKTOPFILE_PATH = path.join(
			app.getPath('home'),
			'.local/share/applications',
			app.data.app_name + '.desktop',
		);
		let success = false;
		const cmd = `sh -c "${process.env.APPIMAGE} --no-sandbox"`;
		fs.writeFileSync(
			Env.LINUX_DESKTOPFILE_PATH,
			`#!/user/bin/env xdg-open
[Desktop Entry]
Version=${app.data.version}
Type=Application
Terminal=false
Exec=${cmd}
Name=${app.data.app_name}
Icon=${path.joinAppData('builds/icons/png/512x512.png')}`,
		);

		console.log(
			`## Desktopfile ${success ? kleur.green().bold('succesfully') : kleur.red().bold('not')} created at`,
			Env.LINUX_DESKTOPFILE_PATH,
			`, command is "${cmd}"`,
		);
		// Not required for Windows since .exe installer does that
	}
}

module.exports = Autostarter;
