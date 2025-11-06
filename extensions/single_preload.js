const fs = require('fs');
const path = require('path');
const Env = require('../env');
const kleur = require('kleur');
const BasePreload = require("../lib/BasePreload")

var preload_dir = null;
process.argv.forEach(arg => {
	if (arg.startsWith('--load-only='))
		preload_dir = arg.split('=')[1];
});

try
{
    if (Env.DEBUG_MODE)
        console.log('preloadimg extension...');
    const PreloadClass = require(preload_dir);
    if (typeof(PreloadClass) !== typeof(function () {}) || Object.getPrototypeOf(PreloadClass) !== BasePreload) { console.log(kleur.grey("Not loading " + ": not a module")); return } ;
    const t = new PreloadClass();
    t.__start();
}
catch (e)
{
    if (Env.DEBUG_MODE)
        console.log("Preload unsuccesful:", e);
}