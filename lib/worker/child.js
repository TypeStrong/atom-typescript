var messages = require('./messages');
setInterval(function () {
    if (!process.connected) {
        process.exit(messages.orphanExitCode);
    }
}, 1000);
var responders = {};
function processData(m) {
    var parsed = m;
    if (!parsed.message || !responders[parsed.message]) {
        return;
    }
    var message = parsed.message;
    try {
        var response = responders[message](parsed.data);
    }
    catch (err) {
        var error = { method: message, message: err.message, stack: err.stack, details: err.details || {} };
    }
    process.send({
        message: message,
        id: parsed.id,
        data: response,
        error: error
    });
}
process.on('message', function (data) {
    processData(data);
});
var projectService = require('../main/lang/projectService');
function addToResponders(func) {
    responders[func.name] = func;
}
Object.keys(projectService).filter(function (funcName) { return typeof projectService[funcName] == 'function'; }).forEach(function (funcName) { return addToResponders(projectService[funcName]); });
