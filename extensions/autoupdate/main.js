const { dialog, app } = require('electron')
const { autoUpdater } = require('electron-updater');
const path = require('../../lib/path2');
const { HOME_BIN_LINUX } = require('../../lib/Constants');
const fs = require('fs');
const ipcChannel = require('../../lib/icpChannel');
const Env = require('../../env');
const BaseModule = require('../../lib/BaseModule');


// WARNING: THIS SCRIPT WILL CHANGE THE MACHINE'S STARTUP BEHAVIOUR.
// TO DISABLE REMOVE .desktop FILE
// WILL TAKE EFFECT ONLY ON BUILD MODE, NOT ON DEV MODE
class Autoupdater extends BaseModule
{
    MODULE_NAME = "autoupdate";
    EXECUTABLE_NAME = "";
    DOWNLOAD_PATH = "";

    updateFunction = () => {this.log("autoupdater not configured");};

    setup()
    {
        this.EXECUTABLE_NAME = app.app_info.app_executable | 'webpage-accessor';
        this.DOWNLOAD_PATH = app.getPath("downloads");
        

        // You can control this behavior:
        autoUpdater.autoDownload = (this.getAppData().auto_downalod == true); // ask first
        autoUpdater.autoInstallOnAppQuit = true; // install after app closes

        if (!Env.IS_EXECUTABLE)
        {
            throw new BaseModule.LoadError("Updater not running: this is app is not packaged!");
        }
        this.log("Starting update checks");

        this.updateFunction = () => autoUpdater.checkForUpdates();

        autoUpdater.on('update-available', info => {
            this.log(`Update available: ${info.version}`);
            dialog.showMessageBox(this.window, {
                type: 'info',
                title: 'Update Available',
                message: `Version ${info.version} is available. Download now?`,
                buttons: ['Yes', 'Later']
            }).then(result => {
                if (result.response === 0)
                    autoUpdater.downloadUpdate();
                else
                    this.warn("User refused to update");
            });
        });
        if (Env.VERBOSE)
            autoUpdater.on('download-progress', progressObj => {
                const logMsg = `Download speed: ${progressObj.bytesPerSecond} - ${progressObj.percent.toFixed(2)}%`;
                this.log(logMsg);
                this.window.setTitle(`Downloading update... ${progressObj.percent.toFixed(0)}%`);
            });

        autoUpdater.on('update-downloaded', info => {

            this.log("Linking executable...")
            
            this.log("Installing");

            autoUpdater.quitAndInstall();
        });

        autoUpdater.on('update-not-available', () => {
            this.log('No updates available.');
            dialog.showErrorBox('No updated available', `Check again later :)`)
        });

        autoUpdater.on('error', err => {
            this.err('Updater error:', err);
            dialog.showErrorBox('Update Error', err == null ? "unknown" : (err.stack || err).toString());
        });

    }

    setup_windows()
    {

    }

    late_setup()
    {
        if (this.__conf.ask_update_on_start != false)
        {
            this.log('Checking for updates...');
            this.updateFunction();
        }
        ipcChannel.newMainHandler('usr-check-for-updates', () => this.updateFunction());
    }
}

module.exports = Autoupdater;
