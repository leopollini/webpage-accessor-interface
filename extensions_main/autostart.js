const { app } = require('electron');
const fs = require('fs');
const path = require('../lib/path2');

// Sample Module. Plase copy-paste this file into new module's main folder
class Autostarter extends require('../lib/BaseModule')
{
    // unspecified: loads data.json
    // MODULE_NAME = "autostarter";
    
    setup()
    {
        this.log("setting autostart to", this.__conf.autostart == true);
        app.on('ready', () => {
            app.setLoginItemSettings({
                openAtLogin: (this.__conf.autostart == true),       // autostart at login
                openAsHidden: false,     // can hide window if desired
            });
        });

        let filel = null;
        const logfile = path.joinAppData("lel.txt");
        if (fs.existsSync(logfile))
            filel = fs.readFileSync(logfile)
        else
            filel = ""
        filel = filel + "\ntried to open at " + Date.now().toString();
        fs.writeFileSync(logfile, filel);
    }
}

module.exports = Autostarter;