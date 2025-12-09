const fs = require('fs');
const path = require('../../lib/path2');
const { notStrictEqual } = require('assert');
const { LINUX_AUTOSTART_LOCATION } = require('../../lib/Constants')

// WARNING: THIS SCRIPT WILL CHANGE THE MACHINE'S STARTUP BEHAVIOUR.
// TO DISABLE REMOVE .desktop FILE
// WILL TAKE EFFECT ONLY ON BUILD MODE, NOT ON DEV MODE
class Autostarter extends require('../../lib/BaseModule')
{
    MODULE_NAME = "autostart";
    autostart_function;

    setup_linux()
    {
        this.log("setting autostart to", this.getAppData().autostart);
        if (this.getAppData().autostart == true)
        this.autostart_function = () => {
            const file_content = `[Desktop Entry]
Name=` + this.getAppConfig().app_info.app_name + `
Comment=webpage accessor
Type=Application
Exec=` + this.getAppConfig().app_info.app_executable;
            // debug location
            // const desktop_file_dir = this.joinData(this.__conf.desktop_filename);
            const desktop_file_dir = path.join(LINUX_AUTOSTART_LOCATION, this.__conf.desktop_filename);
            fs.writeFileSync(desktop_file_dir, file_content);
            this.log("desktop file created");
        }
    }

    setup_windows()
    {
        if (this.getAppData().autostart == true)
            this.autostart_function = function() {
                app.setLoginItemSettings({
                    openAtLogin: true    
                });
            }
    }

    late_setup()
    {
        this.update_desktop_file();
    }

    update_desktop_file()
    {
        return ;
        if (this.autostart_function)
            this.autostart_function();
    }
}

module.exports = Autostarter;