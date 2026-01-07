const fs = require('fs');
const path = require('../../lib/path2');
const { notStrictEqual } = require('assert');
const { LINUX_AUTOSTART_LOCATION } = require('../../lib/Constants');
const BaseModule = require('../../lib/BaseModule');
const Env = require('../../env');

// WARNING: THIS SCRIPT WILL CHANGE THE MACHINE'S STARTUP BEHAVIOUR.
// TO DISABLE REMOVE .desktop FILE
// WILL TAKE EFFECT ONLY ON BUILD MODE, NOT ON DEV MODE
class Autostarter extends BaseModule
{
    MODULE_NAME = "autostart";
    autostart_function;
    do_autostart

    setup_linux()
    {
        this.do_autostart = this.getAppData().autostart && !Env.DEBUG_MODE;
        this.log("setting autostart to", this.do_autostart);
        this.autostart_function = () => {
            const file_content = `[Desktop Entry]
Name=` + this.getAppConfig().app_info.app_name + `
Comment=webpage accessor
Type=Application
Exec=` + this.getAppConfig().app_info.app_executable;
            const desktop_file_dir = path.join(LINUX_AUTOSTART_LOCATION, this.__conf.desktop_filename);
            try {
                if (fs.existsSync(desktop_file_dir))
                    fs.rmSync(desktop_file_dir);
                fs.writeFileSync(desktop_file_dir, file_content);
                this.log("desktop file created");
            } catch (e) {
                throw new BaseModule.LoadError("could not create desktop file at " + desktop_file_dir + "(" + e + ")");
            }
        }
    }

    setup_windows()
    {
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
        if (this.do_autostart == true && this.autostart_function)
            this.autostart_function();
    }
}

module.exports = Autostarter;