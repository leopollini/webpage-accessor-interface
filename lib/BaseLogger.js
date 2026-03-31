const kleur = require('kleur');
const Env = require('../env');

class BaseLogger {
	silent(module_name, message, highlight) {}
	log(module_name, message, highlight) {}
	warn(module_name, message, highlight) {}
	err(module_name, message, highlight) {}
};

// default logger. Format:
// [ extension_name ]: hi am extensiol
// is color-coded.
class SimpleLogger extends BaseLogger {
	silent(module_name, message, highlight) {
		if (Env.VERBOSE)
			console.log('[', (highlight ? kleur.bold().grey : kleur.grey)(module_name), ']:', ...message);
	}
	log(module_name, message, highlight) {
		if (Env.VERBOSE)
			console.log('[', (highlight ? kleur.bold().green : kleur.green)(module_name), ']:', ...message);
	}
	warn(module_name, message, highlight) {
		if (Env.VERBOSE)
			console.log('[', (highlight ? kleur.bold().yellow : kleur.yellow)(module_name), ']:', ...message);
	}
	err(module_name, message, highlight) {
		if (Env.VERBOSE) console.log('[', (highlight ? kleur.bold().red : kleur.red)(module_name), ']:', ...message);
	}
}

module.exports = {BaseLogger: BaseLogger, SimpleLogger: SimpleLogger};
