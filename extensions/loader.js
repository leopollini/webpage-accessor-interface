
const BaseModule = require('../lib/BaseModule');
const path = require('../lib/path2');
const fs = require('fs');
const kleur = require('kleur');
const Env = require('../env');

const EXT_LOAD_DIR = __dirname;

class Loader2
{
    static load(enabled_modules, mainWindow, mainTab) {
        fs.readdirSync(EXT_LOAD_DIR).forEach(function (ext)
        {
            const main = path.join(EXT_LOAD_DIR, ext, 'main.js');
            // console.log("ASDASDAS", ext);
            // console.log("\t at", main_dir);
            if (!fs.existsSync(main)) return;
            
            if (Env.DEBUG_MODE)
                console.log("loading", kleur.green(main));
            try
            {
                const ModuleClass = require(main);
                if (typeof(ModuleClass) !== typeof(function () {}) || Object.getPrototypeOf(ModuleClass) !== BaseModule) { console.log(kleur.grey("Not loading " + ext + ": not a module")); return } ;
                const t = new ModuleClass()
                enabled_modules.push(t);
                t.__start(mainWindow, mainTab);
            }
            catch (e)
            { 
                console.log("Module not loaded:", e);
            }
        });
        enabled_modules.forEach(function (module) {
            if (module.isActive()) module.__late_start();
        });
    }
}

class Loader
{
    static load(enabled_modules, mainWindow, mainTab) {
        fs.readdirSync(EXT_LOAD_DIR).forEach(function (ext)
        {
            const fullpath = path.join(EXT_LOAD_DIR, ext);
            
            if (Env.DEBUG_MODE)
                console.log("loading", kleur.green(ext));
            try
            {
                const ModuleClass = require(fullpath);
                if (typeof(ModuleClass) !== typeof(function () {}) || Object.getPrototypeOf(ModuleClass) !== BaseModule) { console.log(kleur.grey("Not loading " + ext + ": not a module")); return } ;
                const t = new ModuleClass()
                enabled_modules.push(t);
                t.__start(mainWindow, mainTab);
            }
            catch (e)
            { 
                console.log("Module not loaded:", e);
            }
        });
        enabled_modules.forEach(function (module) {
            if (module.isActive()) module.__late_start();
        });
    }
}

module.exports = Loader2;