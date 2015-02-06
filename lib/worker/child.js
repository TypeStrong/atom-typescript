var messages = require('./messages');
var gotMessageDate = new Date();
var maxTimeBetweenMesssages = 1000 * 60 * 20;
setInterval(function () {
    if ((new Date().getTime() - gotMessageDate.getTime()) > maxTimeBetweenMesssages) {
        process.exit(messages.orphanExitCode);
    }
}, 1000);
var responders = {};
function processData(m) {
    var parsed = m;
    if (!parsed.message || !responders[parsed.message])
        return;
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
var programManager = require('../main/lang/programManager');
function addToResponders(func) {
    responders[func.name] = func;
}
addToResponders(programManager.echo);
addToResponders(programManager.quickInfo);
addToResponders(programManager.build);
addToResponders(programManager.errorsForFileFiltered);
addToResponders(programManager.getCompletionsAtPosition);
addToResponders(programManager.emitFile);
addToResponders(programManager.formatDocument);
addToResponders(programManager.formatDocumentRange);
addToResponders(programManager.getDefinitionsAtPosition);
addToResponders(programManager.updateText);
addToResponders(programManager.errorsForFile);
