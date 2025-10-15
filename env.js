// Here be only static defined variables

class Env
{
    static DEBUG_MODE = true;
    static VERBOSE = this.DEBUG_MODE & true;
}

module.exports = Env;