const kleur = require('kleur');
const BaseModule = require('../../lib/BaseModule');
const fs = require('fs');
const path = require('../../lib/path2');
const { app } = require('electron');

module.exports = class BugReport extends BaseModule {
	MODULE_NAME = 'bug-report';
	HIGHLIGHT = true;
	ENTRY_STATUS = kleur.blue('syncing...');
	track_active_tab = false;

	report_temp_dir = path.joinAppData('bug_reports');

	setup() {
		if (!fs.existsSync(this.report_temp_dir)) fs.mkdirSync(this.report_temp_dir);

		process.on('uncaughtException', (e) => {
			this.store_bug(e, 'UncaughtException');
		});

		process.on('unhandledRejection', (e, promise) => {
			this.store_bug(e, 'UnhandledRejection');
		});

		app.on('renderer-process-crashed', (e, webContents, details) => {
			this.store_bug(e, 'RendererCrashed', details);
		});

		app.on('child-process-gone', (e, details) => {
			this.store_bug(e, 'ProcessCrashed', details);
		});

		app.on('gpu-process-crashed', (e) => {
			this.store_bug(e, 'GPUCrashed');
		});
	}

	on_new_tab_created(new_tab) {
		new_tab.webContents.on('crashed', (e) => {
			this.store_bug(e, 'RendererCrashed');
		});

		new_tab.webContents.on('unresponsive', () => {
			this.store_bug(e, 'RendererFrozen');
		});
	}

	late_setup() {
		this.sync_server();
	}

	async sync_server() {
		const api_endpoint = `${this.__conf.endpoint.protocol}://${this.__conf.source_of_validation}/${this.__conf.endpoint.path}`;
		const content = this.load_bugs();

		try {
			const res = fetch(api_endpoint, {
				method: 'POST',
				cache: 'no-store',
				body: content,
			});

			if (!response.ok) {
				this.setStatus(kleur.red('could not connect'));
			} else {
				this.setStatus(kleur.green('synced'));
				this.log('Server state synced!');
			}
		} catch {}
	}

	load_bugs() {
		let res = { report_date: new Date().toISOString(), from: this.__data.id };

		fs.readdirSync(this.report_temp_dir).forEach((rep) => {
			const full_dir = path.join(this.report_temp_dir, rep);
			this.log('send bug (at', full_dir + '}');
		});
	}

	store_bug(event, type, details) {
		this.err('BUG REPORT:\n\t', type, event);

		fs.writeFileSync(
			path.join(this.report_temp_dir, type + '_' + new Date().toISOString().replace('/[:.]/g', '-') + '.txt'),
			`#### BUG EVENT ####
# detected by: ${this.__data.id}
# date: ${new Date().toISOString()}

# event: ${JSON.stringify(event, null, 2)}
${details ? '#details: ' + details : ''}`.replace('\\n', '\n'),
		);
	}
};
