const { EventEmitter } = require('events');

class AppEventBus extends EventEmitter {}

const eventBus = new AppEventBus();

module.exports = eventBus;

// Emit:
//      eventBus.emit('module:event', {data});
// Catch:
//      eventBus.on('module:event, callback);
