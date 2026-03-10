const kleur = require('kleur');
const BaseModule = require('../../lib/BaseModule');
const { app } = require('electron');
const eventBus = require('../../lib/EventBus');

class ServerState {
	static _state = {};

	get state() {
		return ServerState._state;
	}
	set state(_) {
		return {};
	}

	constructor(update_callback) {
		if (typeof update_callback == 'function') {
			this.onSync(update_callback);
		}
	}

	// By calling this function you can register a callback to be called whenever the local server state is updated.
	onSync(callback) {
		eventBus.on('server:synched', () => {
			callback(ServerState._state);
		});
	}

	sync() {
		new ServerRequester.getState();
	}
}

class ServerRequester extends BaseModule {
	MODULE_NAME = 'server-requester';
	IS_MINIMODULE = true;
	HIGHLIGHT = true;
	ENTRY_STATUS = kleur.grey().bold('unsynced');

	do_resync = true;

	state = new ServerState(); // NOTHING INSIDE THIS IS GRANTED: server might always fail so be sure to prevent undefined behaviours

	setup() {
		this.log('heloool');
		setInterval(
			() => {
				if (!this.do_resync) {
					this.setStatus(kleur.grey().bold('unsynced'));
					this.do_resync = true;
				}
			},
			this.__conf.reload_interval * 1000 || 2000,
		);
	}

	on_new_tab_created(newTab) {
		this.newCtrlShortcut('s', () => this.getState(), newTab);
	}

	// pass a function to be called upon subsequent server updates
	async getState(update_callback) {
		if (this.do_resync) {
			await this.get_server_state();
			eventBus.emit('server:synched');
		}
		this.log('current server state:', ServerState._state);

		update_callback?.(ServerState._state);
		return new ServerState(update_callback);
	}

	async get_server_state(re = false) {
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
		let extra_info = { ip: '10.101.0.10', id: 'leo' };

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
				return (ServerState._state = await response.json());
			}
			this.do_resync = true;
			return (ServerState._state = {});
		} catch (e) {
			switch (e.cause.code) {
				case 'ECONNREFUSED':
					this.err('Server is offline:' + e);
					break;
				default:
					this.err('Server connection error:', e);
			}
			this.do_resync = true;
			if (!re) return await this.get_server_state(true); // try another time
			return (ServerState._state = {});
		}
	}
}

module.exports = ServerRequester;
