const { app } = require('electron');

// utils
function createMouseEvent(name, e)
{
	return new MouseEvent(name, e);
}

// utils
function sendMouseEvent(name, e)
{
	e.target.dispatchEvent(createMouseEvent(name, e));
}

function findAppArg(arg)
{
	if (app.args)
		return app.args.find(function(v) {return v == arg});
	return ;
}

module.exports = { createMouseEvent, sendMouseEvent, findAppArg };