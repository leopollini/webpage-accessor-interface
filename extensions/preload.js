const fs = require('fs');
const path = require('../lib/path2');
const Env = require('../env');
const kleur = require('kleur');

const LOAD_DIR = __dirname;
const BasePreload = require("../lib/BasePreload");


async function preload_extension(preload_dir, extension_name)
{
	try
	{
		const PreloadClass = require(preload_dir);
		if (typeof(PreloadClass) !== typeof(function () {}) || Object.getPrototypeOf(PreloadClass) !== BasePreload) { console.log(kleur.grey("Not loading " + ext + ": not a module")); return } ;
		const t = new PreloadClass();
		window.enabled_extensions.push(t);
		t.__start(extension_name);
	}
	catch (e)
	{
		if (Env.DEBUG_MODE)
			console.log(extension_name, "not preloaded", e);
	}
}

window.enabled_extensions = []
fs.readdirSync(LOAD_DIR).forEach(async function (extension_name) {
	const preload_dir = path.join(LOAD_DIR, extension_name, 'preload.js');
	if (!fs.existsSync(preload_dir)) return
	preload_extension(preload_dir, extension_name);
});