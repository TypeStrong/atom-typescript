var childprocess = require('child_process');
var exec = childprocess.exec;
var spawn = childprocess.spawn;
var workerLib = require('./lib/workerLib');
var parent = new workerLib.Parent();
function startWorker() {
    parent.startWorker(__dirname + '/childMain.js', showError);
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
exports.echo = parent.childQuery(projectService.echo);
exports.quickInfo = parent.childQuery(projectService.quickInfo);
exports.build = parent.childQuery(projectService.build);
exports.errorsForFileFiltered = parent.childQuery(projectService.errorsForFileFiltered);
exports.getCompletionsAtPosition = parent.childQuery(projectService.getCompletionsAtPosition);
exports.emitFile = parent.childQuery(projectService.emitFile);
exports.regenerateProjectGlob = parent.childQuery(projectService.regenerateProjectGlob);
exports.formatDocument = parent.childQuery(projectService.formatDocument);
exports.formatDocumentRange = parent.childQuery(projectService.formatDocumentRange);
exports.getDefinitionsAtPosition = parent.childQuery(projectService.getDefinitionsAtPosition);
exports.updateText = parent.childQuery(projectService.updateText);
exports.errorsForFile = parent.childQuery(projectService.errorsForFile);
exports.getSignatureHelps = parent.childQuery(projectService.getSignatureHelps);
exports.getRenameInfo = parent.childQuery(projectService.getRenameInfo);
var parentResponses = require('./parentResponses');
parent.registerAllFunctionsExportedFromAsResponders(parentResponses);
