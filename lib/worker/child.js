var messages = require('./messages');
var gotMessageDate = new Date();
var maxTimeBetweenMesssages = 1000 * 60 * 180;
setInterval(function () {
    if ((new Date().getTime() - gotMessageDate.getTime()) > maxTimeBetweenMesssages) {
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
    process.send({
        message: message,
        id: parsed.id,
        data: responders[message](parsed.data)
    });
}
process.on('message', function (data) {
    gotMessageDate = new Date();
    processData(data);
});
var projectService = require('../main/lang/projectService');
function addToResponders(func) {
    responders[func.name] = func;
}
Object.keys(projectService).filter(function (funcName) { return typeof projectService[funcName] == 'function'; }).forEach(function (funcName) { return addToResponders(projectService[funcName]); });
