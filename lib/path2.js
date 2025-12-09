const path = require('path');
const fs = require('fs');
const { app } = require('electron')
const { EXT_CONFIGS_DIR, APPDATA_DIRNAME, EXT_DATA_DIR } = require('./Constants');
const { findAppArg } = require('./utils');
const Env = require('../env');

class path2
{
    // static __dirname = path.join(__dirname, APPDATA_DIRNAME);
    static appDataDir = path.join((app ? app.getPath('appData') : ""), APPDATA_DIRNAME);   // app might not exist in the preload ambient
    // static appRoot = Env.ROOT_LOCATION;

    static config_location = path.join(path2.appDataDir, EXT_CONFIGS_DIR);

    // returns location inside app's private folder in AppData (location is system-specific)
    static joinAppData(...dir) {return path.join(path2.appDataDir, ...dir);}
    
    // retuns location inside extensions_conf in AppData
    static joinConfigDir(...dir) {return path.join(path2.appDataDir, EXT_CONFIGS_DIR, ...dir);}

    // returns location inside extensions_data in app's root -- READONLY
    static joinDataDir(...dir) {return path.join(Env.ROOT_LOCATION, EXT_DATA_DIR, ...dir);}

    // returns location at app root --
    static joinRootDir(...dir) {return path.join(Env.ROOT_LOCATION, ...dir);}

    // regular old join
    static join(...dir) {return path.join(...dir);}

    static already_required = false;
}

// this section creates a link to extensions_conf inside appdata at the root of the app. Developer utils
if (!path2.already_required && app)
{
    app.whenReady().then(function ()
    {
        if (!fs.existsSync(path2.config_location))
            try {fs.mkdirSync(path2.config_location, { recursive: true });}
            catch (e) {console.log("could not create path to", EXT_CONFIGS_DIR, "in", path2.appDataDir, ".", )}
        if (findAppArg('create_config_link') && !fs.existsSync(path.join(__dirname, '..', EXT_CONFIGS_DIR)))
        {
            console.log('creating dir',path2.config_location )
            fs.symlinkSync(path2.config_location, path.join(__dirname, '..', EXT_CONFIGS_DIR));
        }
    });
    path2.already_required = true;
}

module.exports = path2;