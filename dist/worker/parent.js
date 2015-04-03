///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated
var debug = false;
var childprocess = require('child_process');
var exec = childprocess.exec;
var spawn = childprocess.spawn;
var workerLib = require('./lib/workerLib');
var parent = new workerLib.Parent();
if (debug) {
    parent.sendToIpc = function (x) { return x; };
}
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
function catchCommonErrors(func) {
    return function (q) { return func(q).catch(function (err) {
        return Promise.reject(err);
    }); };
}
var projectService = require('../main/lang/projectService');
exports.echo = catchCommonErrors(parent.sendToIpc(projectService.echo));
exports.quickInfo = catchCommonErrors(parent.sendToIpc(projectService.quickInfo));
exports.build = catchCommonErrors(parent.sendToIpc(projectService.build));
exports.errorsForFileFiltered = catchCommonErrors(parent.sendToIpc(projectService.errorsForFileFiltered));
exports.getCompletionsAtPosition = catchCommonErrors(parent.sendToIpc(projectService.getCompletionsAtPosition));
exports.emitFile = catchCommonErrors(parent.sendToIpc(projectService.emitFile));
exports.formatDocument = catchCommonErrors(parent.sendToIpc(projectService.formatDocument));
exports.formatDocumentRange = catchCommonErrors(parent.sendToIpc(projectService.formatDocumentRange));
exports.getDefinitionsAtPosition = catchCommonErrors(parent.sendToIpc(projectService.getDefinitionsAtPosition));
exports.updateText = catchCommonErrors(parent.sendToIpc(projectService.updateText));
exports.editText = catchCommonErrors(parent.sendToIpc(projectService.editText));
exports.errorsForFile = catchCommonErrors(parent.sendToIpc(projectService.errorsForFile));
exports.getSignatureHelps = catchCommonErrors(parent.sendToIpc(projectService.getSignatureHelps));
exports.getRenameInfo = catchCommonErrors(parent.sendToIpc(projectService.getRenameInfo));
exports.getRelativePathsInProject = catchCommonErrors(parent.sendToIpc(projectService.getRelativePathsInProject));
exports.debugLanguageServiceHostVersion = parent.sendToIpc(projectService.debugLanguageServiceHostVersion);
exports.getProjectFileDetails = parent.sendToIpc(projectService.getProjectFileDetails);
exports.getNavigationBarItems = parent.sendToIpc(projectService.getNavigationBarItems);
exports.getNavigateToItems = parent.sendToIpc(projectService.getNavigateToItems);
exports.getReferences = parent.sendToIpc(projectService.getReferences);
var queryParent = require('./queryParent');
parent.registerAllFunctionsExportedFromAsResponders(queryParent);
