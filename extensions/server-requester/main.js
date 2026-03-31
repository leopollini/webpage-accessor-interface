const kleur = require('kleur');
const BaseModule = require('../../lib/BaseModule');
const { app } = require('electron');

// class ServerState {
// 	static state = {};

// 	constructor(update_callback) {
// 		if (typeof update_callback == 'function') {
// 			update_callback(this.state);
// 			this.onSync(update_callback);
// 		} else delete this;
// 	}

// 	// By calling this function you can register a callback to be called whenever the local server state is updated.
// 	onSync(callback) {
// 		app.on('server:synched', () => {
// 			callback(this.state);
// 		});
// 	}

// 	sync() {
// 		new ServerRequester.getState();
// 	}
// }

class ServerRequester extends BaseModule {
	MODULE_NAME = 'server-requester';
	// IS_MINIMODULE = true;
	// HIGHLIGHT = true;
	// track_active_tab = false;
	ENTRY_STATUS = kleur.grey().bold('unsynced');

	do_resync = true;
	autosync_loop;
	failed_connections = 0;

	state = {};

	setup() {
		this.log('heloool');
		setInterval(
			() => {
				this.setStatus(kleur.grey().bold('unsynced'));
				this.do_resync = true;
			},
			this.__conf.reload_interval * 1000 || 2000,
		);
		if (this.__conf.force_reload_interval)
			this.autosync_loop = setInterval(async () => {
				await this.get_serverstate();
			}, this.__conf.force_reload_interval * 1000);
	}

	on_new_tab_created(newTab) {
		this.newCtrlShortcut('s', () => this.getState(), newTab);
	}

	// accepts a function to be called upon subsequent server updates
	async getState(update_callback) {
		if (this.do_resync) {
			this.state = await this.get_serverstate();
			if (!this.state) this.warn('Could not obtain information from server');
		}
		this.log('current server state:', this.state);

		if (typeof update_callback == 'function') {
			update_callback(this.state);
			app.on('server:synched', update_callback);
		}
		return this.state;
	}

	async get_serverstate(re = false) {
		this.log('refreshing server state');
		this.do_resync = false;
		const api_endpoint = `${this.__conf.endpoint.protocol}://${this.__conf.source_of_validation}/${this.__conf.endpoint.path}`;
		// let query_string = 'lel sos';
		// switch (this.__conf.validation_mode) {
		// 	case 'ip':
		// 		query_string = `ip=${encodeURIComponent('10.101.0.10')}`;
		// 		break;
		// 	case 'id':
		// 		query_string = `id=${encodeURIComponent('waleo')}`;
		// 		break;
		// }
		// const uri = `${api_endpoint}?${query_string}`;
		// (console.log('#####', uri), this.__conf.validation_mode);
		let extra_info = { ip: '10.101.0.10', id: this.__data.id };

		try {
			const response = await fetch(api_endpoint, {
				method: 'POST',
				cache: 'no-store',
				body: JSON.stringify({ ...app.app_info, ...extra_info }),
			});

			if (!response.ok) {
				this.setStatus(kleur.red('could not connect'));
				// throw new BaseModule.ModuleError('Request failed');
			} else {
				this.setStatus(kleur.green('synced'));
				this.log('Server state synced!');
				app.emit('server:synched');
				return await response.json();
			}
			this.do_resync = true;
			return {};
		} catch (e) {
			switch (e.cause?.code) {
				case 'ECONNREFUSED':
					this.err('Server is offline:' + e);
					break;
				default:
					this.err('Server connection error:', e);
			}
			this.do_resync = true;
			if (this.failed_connections++ > this.__conf.max_retries) clearInterval(this.autosync_loop);
			if (!re) return await this.get_serverstate(true); // try another time
			return {};
		}
	}
}

module.exports = ServerRequester;
