// Here be only static defined variables

class Env
{
	static DEBUG_MODE = true;
	static VERBOSE = this.DEBUG_MODE && false;
	static ALWAYS_RECONFIGURE_EXTENSIONS = true;
}

module.exports = Env;