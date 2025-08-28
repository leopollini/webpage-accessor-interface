const path = require('path');
const fs = require('fs');
const kleur = require('kleur');


class PackageCreator
{
	static CONF_FILE_PATH = path.join(__dirname, 'config.json');

	constructor()
	{
		console.log("### CONFIGURING PACKAGE ###");
		try {this.conf = JSON.parse(fs.readFileSync(PackageCreator.CONF_FILE_PATH));}
		catch (e) {return console.log('Could not load config file:', e);}

		// console.log(conf);

		this.createConfigurations();

		try { fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify({...conf.default_data, is_configured: false}, null, 2)); }
		catch { console.log('Could not create data.json file'); }
		// this.conf.is_configured = true;
		// fs.writeFileSync(PackageCreator.CONF_FILE_PATH, JSON.stringify(this.conf, null, 2));
		console.log("### PACKAGE CONFIGURATION CONCLUDED ###");
	}


	createConfigurations()
	{
		this.conf_files_dir = this.conf.configuration.conf_files_dir;
		Reflect.deleteProperty(this.conf.configuration, 'conf_files_dir');
		Object.entries(this.conf.configuration).forEach(([name, conf]) => {
			this.loadConfiguration(conf, name);
		});
	}

	loadConfiguration(conf, name, depth = 0)
	{
		if (Object.keys(conf).length == 0 || conf.enabled == false) return this.betterLog(depth, kleur.yellow('Ignoring'),'configuration of', kleur.grey(name));
		this.betterLog(depth, 'Beginning configuration of', kleur.bold(kleur.blue(name)));
		let env = {...conf};
		Reflect.deleteProperty(env, "actions");
		Reflect.deleteProperty(env, "extension");
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
		fs.writeFileSync(path.join(__dirname, this.conf_files_dir, ext_name) + '.json', JSON.stringify(ext, null, 2));
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