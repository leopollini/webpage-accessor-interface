const path = require('./path2')

// Sample Module. Plase copy-paste this file into new module's main folder
class SAMPLEMODULE extends require('./BaseModule')
{
    MODULE_NAME = "SAMPLEMODULE";    // Does not have to be the same as parent folder

    //// Constructor trace, please leave commented, unless necessary.
    // constructor(window, tab) { super(window, tab); }

    // Setup code here. This function is called in BaseModule's constructor.
    setup() {}
}

module.exports = SAMPLEMODULE;