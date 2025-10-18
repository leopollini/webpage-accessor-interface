const kleur = require('kleur');
const Env = require('../env');
const { app, ipcRenderer } = require('electron');

// like BaseModule but with less expensive features
class BasePreload
{
	// extensions's configuration file content. Different from app.conf
	__conf = null;

	window = null;
	tab = null;
	module_name = "";
	is_active = false;

	constructor() {}

	// Remember! The preload does not guarantee that the contents of the page are ready
	// for modifications (extra style, ecc) untill "DOMContentLoaded" is fired. Before
	// touching stuff like 'document.head' check if it exists; if not add this:
	// window.addEventListener('DOMContentLoaded', () => { callback() });

	// extension's constructors are called after window creation and after app.ready().
	__start(ext)
	{
		this.module_name = ext;
		
		// the responses and the setup calls are managed IN PARALLEL. NO SORTING ORDER IS GRANTED.
		ipcRenderer.invoke('preload-get-extension-conf', ext).then(conf => {
			this.__conf = conf;
			if (!this.__conf) this.warn('__conf not defined.');
			else if (this.__conf.enabled == false) return;
			
			if (this.__conf.enabled == false)
			{
				this.warn("not setting up because disabled in", this.module_name + ".json");
			}
			this.log('Setting up', this.module_name, 'config:', this.__conf, '...');
			if (this.setup) this.setup();
		});
	}

	// Colored logging! Use this instead of console.log()
    log(...message)
	{
		if (Env.DEBUG_MODE) console.log('[', kleur.green(this.module_name), ']:', ...message);
	}
    warn(...message)
	{
		if (Env.DEBUG_MODE) console.log('[', kleur.yellow(this.module_name), ']:', ...message);
	}
    err(...message)
	{
		if (Env.DEBUG_MODE) console.log('[', kleur.red(this.module_name), ']:', ...message);
	}

	// sets active status
	setActive(active = true) {this.is_active = active;}

	// returns active status
	isActive() {return this.is_active;}

	// setup Windows??
}

module.exports = BasePreload;