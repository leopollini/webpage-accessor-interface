const path = require('path');
const fs = require('fs');
const { app } = require('electron')
const { EXT_CONFIGS_DIR, APPDATA_DIRNAME } = require('./Constants');
const { findAppArg } = require('./utils')


class path2
{
    // static __dirname = path.join(__dirname, APPDATA_DIRNAME);
    static __dirname = path.join(app.getPath('appData'), APPDATA_DIRNAME);

    static config_location = path.join(path2.__dirname, EXT_CONFIGS_DIR);

    static joinAppData(...dir) {return path.join(path2.__dirname, ...dir);}
    static joinConfigDir(...dir) {return path.join(path2.__dirname, EXT_CONFIGS_DIR, ...dir);}
    static join(...dir) {return path.join(...dir);}

    static already_required = false;
}


if (!path2.already_required)
{
    app.whenReady().then(function ()
    {
        console.log('creating dir',path2.config_location )
        if (!fs.existsSync(path2.config_location))
            try {fs.mkdirSync(path2.config_location, { recursive: true });}
            catch (e) {console.log("could not create path to", EXT_CONFIGS_DIR, "in", path2.__dirname, ".", )}
        if (findAppArg('create_config_link') && !fs.existsSync(path.join(__dirname, '..', EXT_CONFIGS_DIR)))
            fs.symlinkSync(path2.config_location, path.join(__dirname, '..', EXT_CONFIGS_DIR));
    });
    path2.already_required = true;
}


module.exports = path2;