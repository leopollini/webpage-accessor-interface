const path = require('path');
const { app } = require('electron')
const { EXT_CONFIGS_DIR, APPDATA_DIRNAME } = require('./Constants');

class path2
{
    static __dirname = path.join(app.getPath('appData'), '');

    static joinAppData(...dir) {return path.join(path2.__dirname, APPDATA_DIRNAME, ...dir);}
    static joinConfigDir(...dir) {return path.join(path2.__dirname, APPDATA_DIRNAME, EXT_CONFIGS_DIR, ...dir);}
    static join(...dir) {return path.join(...dir);}
}

module.exports = path2;