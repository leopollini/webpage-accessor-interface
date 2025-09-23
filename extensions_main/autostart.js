const fs = require('fs');
const path = require('../lib/path2');
const { notStrictEqual } = require('assert');
const { LINUX_AUTOSTART_DIR } = require('../lib/Constants')

// WARNING: THIS SCRIPT WILL CHANGE THE MACHINE'S STARTUP BEHAVIOUR.
// TO DISABLE REMOVE .desktop FILE
// WILL TAKE EFFECT ONLY ON BUILD MODE, NOT ON DEV MODE
class Autostarter extends require('../lib/BaseModule')
{
    MODULE_NAME = "autostart";

    setup_linux()
    {
        this.log("setting autostart to", this.getAppData().autostart);
        if (this.getAppData().autostart == true)
        {
            const file_content = `[Desktop Entry]
Name=` + this.getAppConfig().app_info.app_name + `
Comment=webpage accessor autostart script
Type=Application
Exec=` + this.getAppConfig().app_info.app_executable;
            // debug location
            // const desktop_file_dir = this.joinData(this.__conf.desktop_filename);
            const desktop_file_dir = path.join(LINUX_AUTOSTART_DIR, this.__conf.desktop_filename);
            fs.writeFileSync(desktop_file_dir, file_content);
            this.log("desktop file created");
        }
    }

    setup_windows()
    {
        if (this.getAppData().autostart == true)
            app.setLoginItemSettings({
                openAtLogin: true    
            })
    }
}

module.exports = Autostarter;