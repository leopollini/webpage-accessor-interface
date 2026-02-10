const { dialog, app } = require('electron');
const { autoUpdater } = require('electron-updater');
const ipcChannel = require('../../lib/icpChannel');
const Env = require('../../env');
const BaseModule = require('../../lib/BaseModule');
const fs = require('fs');
const path = require('../../lib/path2');

module.exports = class Autoupdate extends BaseModule {
	MODULE_NAME = 'autoupdate';
	EXECUTABLE_NAME = '';
	DOWNLOAD_PATH = '';

	updateFunction = () => {
		if (!Env.DEBUG_MODE) dialog.showErrorBox('Autoupdater not available', ':(');
		this.warn('Autoupdater not available :(');
	};

	setup() {
		this.EXECUTABLE_NAME = app.app_info.app_executable | 'webpage-accessor';
		this.DOWNLOAD_PATH = app.getPath('downloads');

		// You can control this behavior:
		autoUpdater.autoDownload = this.getAppData().auto_downalod == true; // ask first
		autoUpdater.autoInstallOnAppQuit = true; // install after app closes

		ipcChannel.newMainHandler('usr-check-for-updates', () => this.tryUpdate());

		if (!Env.IS_EXECUTABLE) {
			throw new BaseModule.LoadError('this is app is not packaged!');
		}
		this.log('Starting update checks');

		this.updateFunction = () => {
			try {
				autoUpdater.checkForUpdates();
			} catch {
				dialog.showErrorBox('release error', 'This version does not have a release file');
			}
		}

		autoUpdater.on('update-available', (info) => {
			this.log(`Update available: ${info.version}`);
			if (!this.__conf.silent)
				dialog
					.showMessageBox(this.window, {
						type: 'info',
						title: 'Update Available',
						message: `Version ${info.version} is available. Download now?`,
						buttons: ['Yes', 'Later'],
					})
					.then((result) => {
						if (result.response === 0) {
							try {
								fs.rmdirSync(path.joinAppData('builds'));
							} catch (e) {
								// clean build so next run is built
							}
							autoUpdater.downloadUpdate();
						} else this.warn('User refused to update');
					});
			else if (this.__conf.auto_downalod == true)
				autoUpdater.downloadUpdate();
		});
		autoUpdater.on('download-progress', (progressObj) => {
			const logMsg = `Download speed: ${progressObj.bytesPerSecond} - ${progressObj.percent.toFixed(2)}%`;
			this.log(logMsg);
			this.window.setTitle(`Downloading update... ${progressObj.percent.toFixed(0)}%`);
		});

		autoUpdater.on('update-downloaded', (info) => {
			this.log('Linking executable...');

			// Remove build folder for clean reinstall
			if (fs.existsSync(path.joinAppData('builds')))
				fs.rmSync(path.joinAppData('builds'),{ recursive: true, force: true });

			this.log('Installing');

			autoUpdater.quitAndInstall();
		});

		autoUpdater.on('update-not-available', () => {
			this.log('No updates available.');
			if (!this.__conf.silent)
				dialog.showErrorBox('No updates available', `Check again later :)`);
		});

		autoUpdater.on('error', (err) => {
			this.err('Updater error:', err);
			if (!this.__conf.silent)
				dialog.showErrorBox('Update Error', err == null ? 'unknown' : (err.stack || err).toString());
			this.fail_reason = err.toString();
		});
	}

	setup_windows() {}

	late_setup() {
		if (this.__conf.check_update_on_start != false) {
			this.log('Checking for updates...');
			this.tryUpdate();
		}
	}

	tryUpdate() {
		try {
			this.updateFunction();
		} catch (e) {
			this.err(e);
			this.fail_reason = e.toString();
		}
	}
}
