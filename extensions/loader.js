
const BaseModule = require('../lib/BaseModule');
const path = require('../lib/path2');
const fs = require('fs');
const kleur = require('kleur');
const Env = require('../env');

const EXT_LOAD_DIR = __dirname;


const modules = {};
const enabled_modules = new Set();

class Loader2
{   
    mainWindow = null;
    mainTab = null;
    data = null;
    // 'data' shoud be app.data
    static load( mainWindow, mainTab, data) {
        this.mainWindow = mainWindow;
        this.mainTab = mainTab;
        this.data = data;
        
        // load modules -> no setup
        fs.readdirSync(EXT_LOAD_DIR).forEach(function (ext)
        {
            const main = path.join(EXT_LOAD_DIR, ext, 'main.js');
            // console.log("ASDASDAS", ext);
            // console.log("\t at", main_dir);
            if (!fs.existsSync(main)) return;
            
            // if (Env.DEBUG_MODE)
            //     console.log("loading", kleur.green(main));
            // modules.push(main);
            modules[ext] = main;
        });

        // setup all loaded modules
        for (const ext in modules) {
            this.loadModule(ext);
        }

        // Module late start
        enabled_modules.forEach(function (module) {
            if (module.isActive()) module.__late_start();
        });

        return [...enabled_modules];
    }

    static loadModule(ext)
    {
        try
        {
            const ModuleClass = require(modules[ext]);
            if (typeof(ModuleClass) !== typeof(function () {}) || Object.getPrototypeOf(ModuleClass) !== BaseModule) { console.log(kleur.grey("Not loading " + ext + ": not a module")); return } ;
            const t = new ModuleClass()
            enabled_modules.add(t);
            t.__start(this.mainWindow, this.mainTab, this.data);
        }
        catch (e)
        {
            console.log("Module not loaded:", e);
        }
    }
}

// class Loader
// {
//     static load(enabled_modules, mainWindow, mainTab) {
//         fs.readdirSync(EXT_LOAD_DIR).forEach(function (ext)
//         {
//             const fullpath = path.join(EXT_LOAD_DIR, ext);
            
//             if (Env.DEBUG_MODE)
//                 console.log("loading", kleur.green(ext));
//             try
//             {
//                 const ModuleClass = require(fullpath);
//                 if (typeof(ModuleClass) !== typeof(function () {}) || Object.getPrototypeOf(ModuleClass) !== BaseModule) { console.log(kleur.grey("Not loading " + ext + ": not a module")); return } ;
//                 const t = new ModuleClass()
//                 enabled_modules.push(t);
//                 t.__start(mainWindow, mainTab);
//             }
//             catch (e)
//             { 
//                 console.log("Module not loaded:", e);
//             }
//         });
//         enabled_modules.forEach(function (module) {
//             if (module.isActive()) module.__late_start();
//         });
//     }
// }

module.exports = Loader2;