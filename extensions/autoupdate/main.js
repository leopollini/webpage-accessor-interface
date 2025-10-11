const { dialog, app } = require('electron')
const { autoUpdater } = require('electron-updater');
const path = require('../../lib/path2');
const { HOME_BIN_LINUX } = require('../../lib/Constants');


// WARNING: THIS SCRIPT WILL CHANGE THE MACHINE'S STARTUP BEHAVIOUR.
// TO DISABLE REMOVE .desktop FILE
// WILL TAKE EFFECT ONLY ON BUILD MODE, NOT ON DEV MODE
class Autoupdater extends require('../../lib/BaseModule')
{
    MODULE_NAME = "autoupdate";
    EXECUTABLE_NAME = "";

    setup_linux()
    {
        this.EXECUTABLE_NAME = app.app_info.app_executable;

        // You can control this behavior:
        autoUpdater.autoDownload = (this.getAppData().auto_downalod == true); // ask first
        autoUpdater.autoInstallOnAppQuit = true; // install after app closes

        this.log('Checking for updates...');
        autoUpdater.checkForUpdates();

        if (!process.env.APPIMAGE)
        {
            this.warn("process.env.APPIMAGE not assigned: this is not an AppImage!");
            return;
        }
        autoUpdater.on('update-available', info => {
                this.log(`Update available: ${info.version}`);
                dialog.showMessageBox(this.window, {
                type: 'info',
                title: 'Update Available',
                message: `Version ${info.version} is available. Download now?`,
                buttons: ['Yes', 'Later']
            }).then(result => {
                if (result.response === 0) {
                    autoUpdater.downloadUpdate();
                }
                else
                    this.warn("User refused to update");
            });
        });

        autoUpdater.on('download-progress', progressObj => {
            const logMsg = `Download speed: ${progressObj.bytesPerSecond} - ${progressObj.percent.toFixed(2)}%`;
            this.log(logMsg);
            this.window.setTitle(`Downloading update... ${progressObj.percent.toFixed(0)}%`);
        });

        autoUpdater.on('update-downloaded', info => {
            this.log('Update downloaded, will install now.');
            dialog.showMessageBox(this.window, {
                title: 'Install Update',
                message: 'Update downloaded. The app will restart to install.'
            }).then(() => {
                const exec_bin_location = path.join(HOME_BIN_LINUX, this.EXECUTABLE_NAME);
                const newFile = path.join(path.dirname(process.env.APPIMAGE), this.EXECUTABLE_NAME + `-${info.version}.AppImage`);
                this.log("Linking new version:", info.version, "to", newFile, "at", exec_bin_location);
                fs.existsSync(newFile) &&
                    exec(`ln -sf "${newFile}" "${exec_bin_location}"`);
                this.log("Installing");
                // autoUpdater.quitAndInstall();
            })
        });

        autoUpdater.on('update-not-available', () => {
            this.log('No updates available.');
        });

        autoUpdater.on('error', err => {
            this.err('Updater error:', err);
            dialog.showErrorBox('Update Error', err == null ? "unknown" : (err.stack || err).toString());
        });

    }

    setup_windows()
    {

    }
}

module.exports = Autoupdater;
