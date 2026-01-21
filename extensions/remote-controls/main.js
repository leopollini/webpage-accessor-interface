const kleur = require('kleur');
const BaseModule = require('../../lib/BaseModule');
const net = require('node:net');
const { dialog, app } = require('electron');
const BaseLogger = require('../../lib/BaseLogger');

class SocketLogger extends BaseLogger {
	sock;
	constructor(s) {
		super();
		this.sock = s;
	}
	log(module_name, message, highlight) {
		this.sock.write(`\nLOG|${(highlight ? kleur.bold().green : kleur.green)(module_name)}: ${message.join(' ')}`);
	}
	warn(module_name, message, highlight) {
		this.sock.write(`\nWARN|${(highlight ? kleur.bold().yellow : kleur.yellow)(module_name)}: ${message.join(' ')}`);
	}
	err(module_name, message, highlight) {
		this.sock.write(`\nERR|${(highlight ? kleur.bold().red : kleur.red)(module_name)}: ${message.join(' ')}`);
	}
}

module.exports = class RemoteControls extends BaseModule {
	MODULE_NAME = 'remote-controls';
	status = 'connecting...';
	required_modules = [];
	HIGHLIGHT = true;

	sock;
	connected = false;
	failed_retries = 1;
	sockLogger;

	setup() {
		this.sock = new net.Socket();
		this.sockLogger = new SocketLogger(this.sock);
	}

	setupSocket() {
		this.sock.connect(this.__conf.port, this.__conf.host, () => {
			this.log('Connected to server');
			this.sock.write('Hello I am ' + this.__data.terminal_id);
			this.connected = true;
			this.sock.setKeepAlive(true, this.__conf.ping ? this.__conf.ping * 1000 : 10000);
			this.failed_retries = 0;
			this.setStatus(kleur.green('OK'));

			BaseModule.registerLogger(this.sockLogger);

			this.sock.on('data', (data) => {
				// this.log('Got', data, 'from nc server!');
				this.parseRequest(data.toString());
			});
			this.sock.on('close', () => {
				this.warn('Connection has been closed');
				this.setStatus(kleur.yellow('connecting...'));
				this.connected = false;
			});
		});
		this.sock.on('error', (err) => {
			if (err.code == 'ECONNREFUSED') {
				this.warn('Socket could not connect (refused)');
				this.failed_retries++;
				this.connected = false;
			} else {
				this.err('Socket error:', err.code);
				this.fail_reason = err;
			}
		});
	}

	parseRequest(data) {
		const [cmd, ...content] = data.toString().split(' ');
		switch (cmd.toString().trim()) {
			default:
				this.err(cmd.toString().trim() + ': Invalid request');
				break;
			case 'SHUTDOWN':
				this.warn('Shudown request from Server!!!');
				dialog
					.showMessageBox(this.window, {
						type: 'info',
						title: 'Shutting down',
						message:
							'The Server decreted that this terminal session be shut down: ' + content.join(' ').trim(),
						buttons: ['Comply', 'Complain'],
					})
					.then((result) => {
						this.log(result);
						this.sock.write('OK');
						app.exit();
					});
				break;
			case 'WARNING':
				this.warn('Server sent you a warning!!!');
				dialog
					.showMessageBox(this.window, {
						type: 'info',
						title: 'Server warning',
						message: 'The Server has sent you a warning: ' + content.join(' ').trim(),
						buttons: ['Ok', 'Complain'],
					})
					.then();
				this.sock.write('OK');
				break;
			case 'MSG':
				this.log(`You got a message from Server: '${content.join(' ').trim()}'`);
				dialog
					.showMessageBox(this.window, {
						type: 'info',
						title: 'Server message',
						message: 'The Server has sent you a message: ' + content.join(' ').trim(),
						buttons: ['Ok'],
					})
					.then();
				this.sock.write('OK');
				break;
			case 'ID':
				this.log('Server has requested your id');
				this.sock.write(parseInt(this.__data.terminal_id).toString() + 'OK');
				break;
		}
	}

	late_setup() {
		try {
			const sockloop = setInterval(() => {
				if (this.connected) return;
				this.setupSocket();
				if (this.failed_retries >= this.__conf.max_retries) {
					this.failed(`could not connect to ${this.__conf.host}:${this.__conf.port}`);
					clearInterval(sockloop);
				}
			}, this.__conf.conn_timeout * 1000);
		} catch (e) {
			throw new BaseModule.LoadError(e);
		}
	}

	onNewTabCreated(newTab) {}
};
