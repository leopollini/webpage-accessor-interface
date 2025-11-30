const { app, dialog } = require('electron');
const path = require('./lib/path2');
const fs = require('fs');
const kleur = require('kleur');
const { EXT_CONFIGS_DIR, LINUX_AUTOSTART_DIR, HOME_BIN_LINUX, DATA_FILE_PATH } = require('./lib/Constants');
const Env = require('./env');
const { findAppArg } = require('./lib/utils');

class PackageCreator
{
	static CONF_FILE_PATH = Env.IS_EXECUTABLE ?  path.joinAppData('config.json') : path.join(__dirname, 'config.json');
	static DATA_FILE_PATH = path.joinConfigDir(DATA_FILE_PATH);
	static PC_SUCCESS = false;

	constructor()
	{
		this.ensureAppDirectories();

		// loads config file
		try {
			const config_file_content = fs.readFileSync(PackageCreator.CONF_FILE_PATH);
			fs.writeFileSync(path.joinAppData('config.json'), config_file_content);			// Create a readonly copy of currently active config file
			this.conf = JSON.parse(config_file_content);
			app.app_info = this.conf.app_info;
		}
		catch(e) {
			// Choose a new config file for the appp
			app.on('ready', () => {			
				console.log('Main: could not load config file:', e);
				dialog.showErrorBox('Bad Config', `Please chose a valid config file and restart the app.`);
				dialog.showOpenDialog({
					title: "Select Config File",
					buttonLabel: "Load",
					properties: ["openFile"],
					filters: [{ name: "JSON Files", extensions: ["json"] }]
				}).then(({canceled, filePaths}) => {
					if (canceled || !filePaths || filePaths.length == 0)
					{
						console.log("Bad File Selected:", canceled, filePaths);
						app.quit();
						return;
					}
					console.log("## new config file at", filePaths[0])
					// fs.rmSync(PackageCreator.CONF_FILE_PATH);
					fs.linkSync(filePaths[0], PackageCreator.CONF_FILE_PATH);
					app.quit();
					return ;
				});
			});
			return
		}
		// load data file, if present

		if (fs.existsSync(PackageCreator.DATA_FILE_PATH))
		{
			try
			{
				app.data = JSON.parse(fs.readFileSync(PackageCreator.DATA_FILE_PATH));
				// if (new Date(app.data.last_configured) > new Date(fs.statSync(PackageCreator.CONF_FILE_PATH).birthtime))
				// 	console.log("New configuration file detected! Creating new extension conf files...");
				// else if (app.data.is_configured == true && !findAppArg('reload-configs'))
				// {
				// 	console.log("### APP ALREADY CONFIGURED ###");
				// 	return;
				// }
			}
			catch(e) {console.log('Main: could not load data file. Reconfiguring Webpage Accessor. Error was:', e); }
		}
		if (Env.CLEAR_CONFS_ON_RESTART)
		{
			console.log("### CLEARING OLD CONFIGURATIONS ###");
			try {
				if (fs.existsSync(path.joinConfigDir())) {
					fs.readdirSync(path.joinConfigDir()).forEach(entry => {
						const fullPath = path.join(path.joinConfigDir(), entry);
						try {
							fs.rmSync(fullPath, { recursive: true, force: true });
							console.log('\t@ Removed', fullPath);
						}
						catch (err) {
							console.log('Could not remove', fullPath, err);
						}
					});
				}
			}
			catch (e) {
				console.log('Error clearing appData folder:', e);
			}
		}
		console.log("### CONFIGURING PACKAGES ###");

		// console.log(conf);

		this.createConfigurations();

		let data_file_content = {...this.conf.default_data, is_configured: true, ...this.conf.app_info, last_configured: Date.now()}
		try { fs.writeFileSync(PackageCreator.DATA_FILE_PATH, JSON.stringify(data_file_content, null, 2)); }
		catch (e) { console.log('Could not create data.json file:', e); }
		finally {console.log("### CONFIGURATION FINISHED ###")};
		app.data = data_file_content;
		PackageCreator.PC_SUCCESS = true;
		// fs.writeFileSync(PackageCreator.CONF_FILE_PATH, JSON.stringify(this.conf, null, 2));
	}

	ensureAppDirectories()
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
		if (Object.keys(conf).length == 0 || (!Env.CREATE_CONF_FOR_DISABLED_EXTENSIONS && conf.enabled === false)) return this.betterLog(depth, kleur.yellow('Ignoring'),'configuration of', kleur.grey(name));
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
		if (!Env.CREATE_CONF_FOR_DISABLED_EXTENSIONS && actions.enabled == false) return this.betterLog(depth, kleur.yellow('Ignoring'),'actions for', kleur.grey(name), 'because', kleur.red('disabled'));
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
		if (!Env.ALWAYS_RECONFIGURE_EXTENSIONS && fs.existsSync(path.joinConfigDir(ext.extension + '.json')))
		{
			// return this.betterLog(depth + 1, kleur.yellow('Ignoring'),'extension', kleur.grey(name), 'because is already configured');
			this.betterLog(depth + 1, 'extension', kleur.grey(name), 'already configured, adding extra content');
			try
			{
				ext = {...ext, ...JSON.parse(fs.readFileSync(path.joinConfigDir(ext.extension + '.json')))};
			}
			catch (e)
			{
				this.betterLog(depth + 1, 'could not load original content. Overwriting.');
			}
		}
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