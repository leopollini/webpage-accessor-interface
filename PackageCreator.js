const { app } = require('electron');
const path = require('./lib/path2');
const fs = require('fs');
const kleur = require('kleur');
const { EXT_CONFIGS_DIR, DATA_FILE_CONF_PATH: DATA_CONF_PATH, LINUX_AUTOSTART_DIR, HOME_BIN_LINUX } = require('./lib/Constants');
const Env = require('./env');
const { findAppArg } = require('./lib/utils');

class PackageCreator
{
	static CONF_FILE_PATH = path.join(__dirname, 'config.json');
	static DATA_FILE_PATH = path.joinConfigDir('data.json');

	constructor()
	{
		// loads config file
		try {app.conf = JSON.parse(fs.readFileSync(PackageCreator.CONF_FILE_PATH));}
		catch(e) {console.log('Main: could not load config file:', e); app.exit(0); } // new pc(); return ;}
		// load data file, if present

		if (fs.existsSync(PackageCreator.DATA_FILE_PATH))
		{
			try
			{
				app.data = JSON.parse(fs.readFileSync(PackageCreator.DATA_FILE_PATH));
				if (app.data.is_configured == true && !findAppArg('reload-configs'))
				{
					console.log("### APP ALREADY CONFIGURED ###");
					return;
				}
			}
			catch(e) {console.log('Main: could not load data file. Reconfiguring Webpage Accessor', e); }
		}
		console.log("### CONFIGURING PACKAGE ###");


		this.createAppDirectories();
		this.conf = app.conf;

		// console.log(conf);

		this.createConfigurations();

		let data_file_content = {...this.conf.default_data, is_configured: true, ...this.conf.app_info}
		try { fs.writeFileSync(PackageCreator.DATA_FILE_PATH, JSON.stringify(data_file_content, null, 2)); }
		catch (e) { console.log('Could not create data.json file:', e); }
		finally {console.log("### CONFIGURATION FINISHED ###")};
		app.data = data_file_content;
		app.app_info = app.conf.app_info;
		// fs.writeFileSync(PackageCreator.CONF_FILE_PATH, JSON.stringify(this.conf, null, 2));
	}

	createAppDirectories()
	{
		// Inside AppData
		[EXT_CONFIGS_DIR].forEach(dir => {
			dir = path.joinAppData(dir);
			if (!fs.existsSync(dir))
			{
				fs.mkdirSync(dir, { recursive: true });
			}
			console.log("@ Created", dir);
		});

		// Not inside AppData
		[LINUX_AUTOSTART_DIR, HOME_BIN_LINUX].forEach(dir => {
			dir = path.join(dir);
			if (!fs.existsSync(dir))
			{
				fs.mkdirSync(dir, { recursive: true });
			}
			console.log("@ Created", dir);
		});
	}
	
	createConfigurations()
	{
		Object.entries(this.conf.configuration).forEach(([name, conf]) => {
			this.loadConfiguration(conf, name);
		});
	}

	loadConfiguration(conf, name, depth = 0)
	{
		if (Object.keys(conf).length == 0 || conf.enabled === false) return this.betterLog(depth, kleur.yellow('Ignoring'),'configuration of', kleur.grey(name));
		this.betterLog(depth, 'Beginning configuration of', kleur.bold(kleur.blue(name)));
		let env = {...conf};
		Reflect.deleteProperty(env, "actions");
		Reflect.deleteProperty(env, "extension");
		if (Env.VERBOSE)
		{
			Object.entries(env).forEach(cnf => {
				if (cnf[0] != 'enabled') this.betterLog(depth + 1, " ", cnf);
			});
		}
		// only actions xor extension allowed, not both
		if (conf.actions) this.loadActions(conf.actions, env, name, depth);
		else if (conf.extension) this.loadExtension({...env, ...conf.extension}, name, depth);
		console.log('|\t'.repeat(depth) + '|__' + kleur.green(' done'));
		
	}

	loadActions(actions, env, name, depth)
	{
		if (actions.enabled == false) return this.betterLog(depth, kleur.yellow('Ignoring'),'actions for', kleur.grey(name), 'because', kleur.red('disabled'));
		Object.entries(actions).forEach(([name, ext]) => {
			this.loadExtension({...env, ...ext}, name, depth);
		});
	}
	
	loadExtension(ext, name, depth)
	{
		if (ext.enabled == false) return this.betterLog(depth + 1, kleur.yellow('Ignoring'),'extension', kleur.grey(name), 'because', kleur.red('disabled'));
		if (ext.actions)
		{
			this.loadConfiguration(ext, name, depth + 1);
			return ;
		}
		if (!ext.extension) return this.betterLog(depth + 1, kleur.yellow('Ignoring'),'extension', kleur.grey(name), 'because configuration is', kleur.red('missing'));
		this.betterLog(depth + 1, 'configuring', kleur.green(name));
		const ext_name = ext.extension;
		Reflect.deleteProperty(ext, 'extension');
		if (Env.VERBOSE)
		{
			Object.entries(ext).forEach(cnf => {
				if (cnf[0] != 'enabled') this.betterLog(depth + 1, " ", cnf);
			});
		}
		fs.writeFileSync(path.joinConfigDir(ext_name + '.json'), JSON.stringify(ext, null, 2));
	}

	betterLog(depth, ...msg)
	{
		if (depth >= 1)
			console.log('|\t'.repeat(depth-1) + '|_______' + msg.join(' '));
		else
			console.log(...msg);
	}
}

module.exports = PackageCreator;