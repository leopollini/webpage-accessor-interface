const BaseModule = require('../../lib/BaseModule');

module.exports = class SAMPLE_MODULE extends BaseModule {
	// name of the module. MUST be the same as the one in config.js
	MODULE_NAME = 'SAMPLE_MODULE';

	// runs extension even if disabled by config or cofig does not exist
	FORCE_RUN = false;

	// whether the log is printed in bold
	HIGHLIGHT = false;

	// status returned by get status at setup
	ENTRY_STATUS;

	// a list of modules which must be loaded before this module
	required_modules = [];

	// whether this.tab should track TabsManager.active_tab or not
	track_active_tab = true;

	// called just after window init
	setup() {}

	// called only on windows machine
	setup_windows() {}

	// called only on linux machine
	setup_linux() {}

	// called after every extension has already been loaded
	late_setup() {}

	// called every time a new tab is created
	on_new_tab_created(newTab) {}
};
