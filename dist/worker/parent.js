var debug_1 = require("./debug");
var childprocess = require('child_process');
var exec = childprocess.exec;
var spawn = childprocess.spawn;
var workerLib = require('./lib/workerLib');
var atomConfig = require("../main/atom/atomConfig");
var parent = new workerLib.Parent();
var mainPanel = require("../main/atom/views/mainPanelView");
parent.pendingRequestsChanged = function (pending) {
    if (!mainPanel.panelView)
        return;
    mainPanel.panelView.updatePendingRequests(pending);
};
if (debug_1.debugSync) {
    parent.sendToIpc = function (x) { return x; };
    parent.sendToIpcOnlyLast = function (x) { return x; };
}
function startWorker() {
    parent.startWorker(__dirname + '/child.js', showError, atomConfig.typescriptServices ? [atomConfig.typescriptServices] : []);
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
exports.getCompletionsAtPosition = parent.sendToIpcOnlyLast(projectService.getCompletionsAtPosition, {
    completions: [],
    endsInPunctuation: false
});
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
exports.getSemtanticTree = parent.sendToIpc(projectService.getSemtanticTree);
exports.getNavigateToItems = parent.sendToIpc(projectService.getNavigateToItems);
exports.getReferences = parent.sendToIpc(projectService.getReferences);
exports.getAST = parent.sendToIpc(projectService.getAST);
exports.getASTFull = parent.sendToIpc(projectService.getASTFull);
exports.getDependencies = parent.sendToIpc(projectService.getDependencies);
exports.getQuickFixes = parent.sendToIpc(projectService.getQuickFixes);
exports.applyQuickFix = parent.sendToIpc(projectService.applyQuickFix);
exports.getOutput = parent.sendToIpc(projectService.getOutput);
exports.getOutputJs = parent.sendToIpc(projectService.getOutputJs);
exports.getOutputJsStatus = parent.sendToIpc(projectService.getOutputJsStatus);
exports.softReset = parent.sendToIpc(projectService.softReset);
exports.getRenameFilesRefactorings = parent.sendToIpc(projectService.getRenameFilesRefactorings);
exports.createProject = parent.sendToIpc(projectService.createProject);
exports.toggleBreakpoint = parent.sendToIpc(projectService.toggleBreakpoint);
var queryParent = require('./queryParent');
parent.registerAllFunctionsExportedFromAsResponders(queryParent);
