var childprocess = require('child_process');
var exec = childprocess.exec;
var spawn = childprocess.spawn;
var workerLib = require('./lib/workerLib');
var parent = new workerLib.Parent();
function startWorker() {
    parent.startWorker(__dirname + '/child.js', showError);
    console.log('AtomTS worker started');
}
exports.startWorker = startWorker;
function stopWorker() {
    parent.stopWorker();
}
exports.stopWorker = stopWorker;
function showError(error) {
    var message = "Failed to start a child TypeScript worker. Atom-TypeScript is disabled.";
    if (process.platform === "win32") {
        message = message + " Make sure you have 'node' installed and available in your system path.";
    }
    atom.notifications.addError(message, { dismissable: true });
    if (error) {
        console.error('Failed to activate ts-worker:', error);
    }
}
var projectService = require('../main/lang/projectService');
exports.echo = parent.sendToIpc(projectService.echo);
exports.quickInfo = parent.sendToIpc(projectService.quickInfo);
exports.build = parent.sendToIpc(projectService.build);
exports.errorsForFileFiltered = parent.sendToIpc(projectService.errorsForFileFiltered);
exports.getCompletionsAtPosition = parent.sendToIpc(projectService.getCompletionsAtPosition);
exports.emitFile = parent.sendToIpc(projectService.emitFile);
exports.regenerateProjectGlob = parent.sendToIpc(projectService.regenerateProjectGlob);
exports.formatDocument = parent.sendToIpc(projectService.formatDocument);
exports.formatDocumentRange = parent.sendToIpc(projectService.formatDocumentRange);
exports.getDefinitionsAtPosition = parent.sendToIpc(projectService.getDefinitionsAtPosition);
exports.updateText = parent.sendToIpc(projectService.updateText);
exports.errorsForFile = parent.sendToIpc(projectService.errorsForFile);
exports.getSignatureHelps = parent.sendToIpc(projectService.getSignatureHelps);
exports.getRenameInfo = parent.sendToIpc(projectService.getRenameInfo);
var parentResponses = require('./parentResponses');
parent.registerAllFunctionsExportedFromAsResponders(parentResponses);
