const { app, dialog } = require('electron');
const path = require('./lib/path2');
const fs = require('fs');
const kleur = require('kleur');
const {
	EXT_CONFIGS_DIR,
	LINUX_AUTOSTART_DIR,
	HOME_BIN_LINUX,
	DATA_FILE_PATH,
	SAMPLE_CONFIGS_DIR,
} = require('./lib/Constants');
const Env = require('./env');
const { findAppArg } = require('./lib/utils');

class PackageCreator {
	static CONF_FILE_PATH = Env.IS_EXECUTABLE ? path.joinAppData('config.json') : path.join(__dirname, 'config.json');
	static DATA_FILE_PATH = path.joinConfigDir(DATA_FILE_PATH);
	static PC_SUCCESS = false;
	static IS_BUILD_RUN = false;

	constructor() {
		this.ensureAppDirectories();

		this.extractBuildComponents();

		if (this.loadConfigFileAndDataFile()) return;

		if (Env.CLEAR_CONFS_ON_RESTART && app.data.clear_confs_set !== false) this.clearConfigs();
		console.log('### CONFIGURING PACKAGES ###');

		this.createConfigurations();

		this.conf.app_info.version = app.getVersion();
		this.conf.app_info.last_configured = Date.now();
		// the object's unpacking order is VERY important: first the incoming data from the (eventually new) config file,
		// then whatever whas set in data.json before launching, then the incoming app info, then some extra info.
		app.data = {
			...this.conf.default_data,
			...app.data,
			...this.conf.app_info,
			is_configured: true,
		};
		if (Env.DEBUG_MODE) console.log(app.data);

		// Save the data.json file
		try {
			fs.writeFileSync(PackageCreator.DATA_FILE_PATH, JSON.stringify(app.data, null, 4));
		} catch (e) {
			console.log('Could not create data.json file:', e);
		}

		console.log('### CONFIGURATION FINISHED ###');
		PackageCreator.PC_SUCCESS = true;
	}

	extractBuildComponents() {
		if (!fs.existsSync(path.joinAppData('builds'))) {
			PackageCreator.IS_BUILD_RUN = true;
			fs.mkdirSync(path.joinAppData('builds'));
			fs.cpSync(path.joinRootDir('builds'), path.joinAppData('builds'), { recursive: true, force: true });
		}
	}

	// returns False in case of success, True in case of problems with config file
	loadConfigFileAndDataFile() {
		try {
			const config_file_content = fs.readFileSync(PackageCreator.CONF_FILE_PATH);
			this.conf = JSON.parse(config_file_content);
			app.app_info = this.conf.app_info;
		} catch (e) {
			console.log('Main: could not load config file:' + e);
			if (e.message.includes('ENOENT') && this.requestConfig()) return new PackageCreator(); // try again
			app.quit();
			return true;
		}

		if (fs.existsSync(PackageCreator.DATA_FILE_PATH)) {
			try {
				app.data = JSON.parse(fs.readFileSync(PackageCreator.DATA_FILE_PATH));
			} catch (e) {
				console.log('Main: could not load data file. Reconfiguring data.json. Error was:', e);
			}
		}
		return false;
	}


	clearConfigs() {
		console.log('DATA: ', app.data);
		if (Env.CLEAR_CONFS_ON_RESTART == 'ask' && !app.data.clear_confs_set) {
			switch (
				dialog.showMessageBoxSync({
					type: 'question',
					buttons: ['Yes', 'No'], //, 'Clear Always', 'Never Clear'],
					defaultId: 0,
					cancelId: 1,
					title: 'Debug',
					message: 'Clear old configurations? (debug mode)',
				})
			) {
				case 0:
					break;
				default:
					return;
				case 2:
					app.data.clear_conf_set = true;
					break;
				case 3:
					app.data.clear_conf_set = false;
					return;
			}
		}
		console.log('### CLEARING OLD CONFIGURATIONS ###');
		try {
			if (fs.existsSync(path.joinConfigDir())) {
				fs.readdirSync(path.joinConfigDir()).forEach((entry) => {
					const fullPath = path.join(path.joinConfigDir(), entry);
					try {
						fs.rmSync(fullPath, { recursive: true, force: true });
						console.log('\t@ Removed', fullPath);
					} catch (err) {
						console.log('Could not remove', fullPath, err);
					}
				});
			}
		} catch (e) {
			console.log('Error clearing appData folder:', e);
		}
	}

	// This asks the user to chose a config file from the Samples folder
	requestConfig() {
		// Choose a new config file for the app
		this.unpackSampleConfigs();
		dialog.showErrorBox('Bad Config', `Please chose a valid config file.`);
		const filePaths = dialog.showOpenDialogSync({
			title: 'Select Config File',
			buttonLabel: 'Load',
			defaultPath: Env.IS_EXECUTABLE
				? path.joinAppData(SAMPLE_CONFIGS_DIR)
				: path.joinRootDir(SAMPLE_CONFIGS_DIR),
			properties: ['openFile'],
			filters: [{ name: 'JSON Files', extensions: ['json'] }],
		});
		if (!filePaths || filePaths.length == 0) {
			console.log('Bad File Selected:', filePaths);
			return false;
		}
		console.log('## new config file at', filePaths[0]);
		// fs.rmSync(PackageCreator.CONF_FILE_PATH);
		try {
			fs.linkSync(filePaths[0], PackageCreator.CONF_FILE_PATH);
		} catch {
			console.log('Error: could not create link to', filePaths[0], '.');
			return false;
		}
		// app.quit();
		return true;
	}

	unpackSampleConfigs() {
		// if (Env.IS_EXECUTABLE)
		console.log(
			'Cloning sample configs (from',
			path.joinRootDir(SAMPLE_CONFIGS_DIR),
			'to',
			path.joinAppData(SAMPLE_CONFIGS_DIR) + ')',
		);
		fs.cpSync(
			path.joinRootDir(SAMPLE_CONFIGS_DIR),
			path.joinAppData(SAMPLE_CONFIGS_DIR),
			{ recursive: true, force: true },
			() => {},
		);
	}

	ensureAppDirectories() {
		// Inside AppData
		[EXT_CONFIGS_DIR, SAMPLE_CONFIGS_DIR].forEach((dir) => {
			dir = path.joinAppData(dir);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}
			console.log('@ Created', dir);
		});

		// Not inside AppData
		[LINUX_AUTOSTART_DIR, HOME_BIN_LINUX].forEach((dir) => {
			dir = path.join(dir);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}
			console.log('@ Created', dir);
		});
	}

	// If configurations are already present, this function eventually updates them with new parameters from the config file.
	createConfigurations() {
		Object.entries(this.conf.configuration).forEach(([name, conf]) => {
			this.loadConfiguration(conf, name);
		});
	}

	loadConfiguration(conf, name, depth = 0) {
		if (Object.keys(conf).length == 0 || (!Env.CREATE_CONF_FOR_DISABLED_EXTENSIONS && conf.enabled === false))
			return this.betterLog(depth, kleur.yellow('Ignoring'), 'configuration of', kleur.grey(name));
		this.betterLog(depth, 'Beginning configuration of', kleur.bold(kleur.blue(name)));
		let env = { ...conf };
		Reflect.deleteProperty(env, 'actions');
		Reflect.deleteProperty(env, 'extension');
		if (Env.VERBOSE) {
			Object.entries(env).forEach((cnf) => {
				if (cnf[0] != 'enabled') this.betterLog(depth + 1, ' ', cnf);
			});
		}
		// only actions xor extension allowed, not both
		if (conf.actions) this.loadActions(conf.actions, env, name, depth);
		else if (conf.extension) this.loadExtension({ ...env, ...conf.extension }, name, depth);
		console.log('|\t'.repeat(depth) + '|__' + kleur.green(' done'));
	}

	loadActions(actions, env, name, depth) {
		if (!Env.CREATE_CONF_FOR_DISABLED_EXTENSIONS && actions.enabled == false)
			return this.betterLog(
				depth,
				kleur.yellow('Ignoring'),
				'actions for',
				kleur.grey(name),
				'because',
				kleur.red('disabled'),
			);
		Object.entries(actions).forEach(([name, ext]) => {
			this.loadExtension({ ...env, ...ext }, name, depth);
		});
	}

	loadExtension(ext, name, depth) {
		if (ext.enabled == false)
			return this.betterLog(
				depth + 1,
				kleur.yellow('Ignoring'),
				'extension',
				kleur.grey(name),
				'because',
				kleur.red('disabled'),
			);

		if (ext.actions) {
			this.loadConfiguration(ext, name, depth + 1);
			return;
		}
		if (!ext.extension)
			return this.betterLog(
				depth + 1,
				kleur.yellow('Ignoring'),
				'extension',
				kleur.grey(name),
				'because configuration is',
				kleur.red('missing'),
			);
		if (!Env.ALWAYS_RECONFIGURE_EXTENSIONS && fs.existsSync(path.joinConfigDir(ext.extension + '.json'))) {
			// return this.betterLog(depth + 1, kleur.yellow('Ignoring'),'extension', kleur.grey(name), 'because is already configured');
			this.betterLog(depth + 1, 'extension', kleur.grey(name), 'already configured, adding extra content');
			try {
				ext = {
					...ext,
					...JSON.parse(fs.readFileSync(path.joinConfigDir(ext.extension + '.json'))),
				};
			} catch (e) {
				this.betterLog(depth + 1, 'could not load original content. Overwriting.');
			}
		}
		this.betterLog(depth + 1, 'configuring', kleur.green(name));
		const ext_name = ext.extension;
		Reflect.deleteProperty(ext, 'extension');
		if (Env.VERBOSE) {
			Object.entries(ext).forEach((cnf) => {
				if (cnf[0] != 'enabled') this.betterLog(depth + 1, ' ', cnf);
			});
		}
		fs.writeFileSync(path.joinConfigDir(ext_name + '.json'), JSON.stringify(ext, null, 4));
	}

	betterLog(depth, ...msg) {
		if (depth >= 1) console.log('|\t'.repeat(depth - 1) + '|_______' + msg.join(' '));
		else console.log(...msg);
	}
}

module.exports = PackageCreator;
