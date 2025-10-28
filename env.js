// Here be only static defined variables

class Env
{
    static DEBUG_MODE = true;
    static VERBOSE = this.DEBUG_MODE;
    static ALWAYS_RECONFIGURE_EXTENSIONS = false;
}

module.exports = Env;