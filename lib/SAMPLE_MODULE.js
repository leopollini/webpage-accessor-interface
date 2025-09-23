const path = require('./path2')

// Sample Module. Plase copy-paste this file into new module's main folder
class SAMPLEMODULE extends require('./BaseModule')
{
    MODULE_NAME = "SAMPLEMODULE";    // MUST be the same as the 'extension' field in config.json

    //// Constructor trace, please leave commented, unless necessary.
    // constructor(window, tab) { super(window, tab); }

    // Setup code here. This function is called in BaseModule's constructor.
    setup() {}

    // linux specific setup section. Called after setup()
    setup_linux() {}

    // Extra setup code here. Called after every other service has already been setup
    late_setup() {}
} 

module.exports = SAMPLEMODULE;