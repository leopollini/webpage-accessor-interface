const path = require('path');
const fs = require('fs');
const { app } = require('electron')
const { EXT_CONFIGS_DIR, APPDATA_DIRNAME } = require('./Constants');

class path2
{
    static __dirname = path.join(app.getPath('appData'), APPDATA_DIRNAME);
    static config_location = path.join(path2.__dirname, EXT_CONFIGS_DIR);

    static joinAppData(...dir) {return path.join(path2.__dirname, ...dir);}
    static joinConfigDir(...dir) {return path.join(path2.__dirname, EXT_CONFIGS_DIR, ...dir);}
    static join(...dir) {return path.join(...dir);}
}

try {fs.mkdirSync(path2.__dirname, { recursive: true });}
catch (e) {console.log("could not create path to", EXT_CONFIGS_DIR, "in", path2.__dirname, ".", )}
fs.symlinkSync(path2.config_location, path.join(__dirname, '..', EXT_CONFIGS_DIR));

module.exports = path2;