const { dialog } = require('electron')
const { autoUpdater } = require('electron-updater')

// WARNING: THIS SCRIPT WILL CHANGE THE MACHINE'S STARTUP BEHAVIOUR.
// TO DISABLE REMOVE .desktop FILE
// WILL TAKE EFFECT ONLY ON BUILD MODE, NOT ON DEV MODE
class Autoupdater extends require('../../lib/BaseModule')
{
    MODULE_NAME = "autoupdate";

    setup_linux()
    {
        // You can control this behavior:
        autoUpdater.autoDownload = false; // ask first
        autoUpdater.autoInstallOnAppQuit = true; // install after app closes

        this.log('Checking for updates...');
        autoUpdater.checkForUpdates();

        autoUpdater.on('update-available', info => {
            this.log(`Update available: ${info.version}`);
            dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Available',
            message: `Version ${info.version} is available. Download now?`,
            buttons: ['Yes', 'Later']
            }).then(result => {
            if (result.response === 0) {
                autoUpdater.downloadUpdate();
            }
            });
        });

        autoUpdater.on('download-progress', progressObj => {
            const logMsg = `Download speed: ${progressObj.bytesPerSecond} - ${progressObj.percent.toFixed(2)}%`;
            this.log(logMsg);
            mainWindow.setTitle(`Downloading update... ${progressObj.percent.toFixed(0)}%`);
        });

        autoUpdater.on('update-downloaded', info => {
            this.log('Update downloaded, will install now.');
            dialog.showMessageBox(mainWindow, {
            title: 'Install Update',
            message: 'Update downloaded. The app will restart to install.'
            }).then(() => {
            autoUpdater.quitAndInstall();
            });
        });

        autoUpdater.on('update-not-available', () => {
            this.log('No updates available.');
        });

        autoUpdater.on('error', err => {
            log.error('Updater error:', err);
            dialog.showErrorBox('Update Error', err == null ? "unknown" : (err.stack || err).toString());
        });
    }

    setup_windows()
    {

    }
}

module.exports = Autoupdater;
