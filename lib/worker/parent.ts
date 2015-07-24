import {debugSync} from "./debug";

import childprocess = require('child_process');
var exec = childprocess.exec;
var spawn = childprocess.spawn;

import workerLib = require('./lib/workerLib');
import tsconfig = require('../main/tsconfig/tsconfig');
import * as atomConfig from "../main/atom/atomConfig";

var parent = new workerLib.Parent();
import * as mainPanel from "../main/atom/views/mainPanelView";
parent.pendingRequestsChanged = (pending) => {
    // We only start once the panel view is initialized
    if (!mainPanel.panelView) return;

    mainPanel.panelView.updatePendingRequests(pending);
};

/** The only effect of debug is to really not route stuff to the child */
if (debugSync) {
    parent.sendToIpc = x => x;
    parent.sendToIpcOnlyLast = x => x;
}

export function startWorker() {
    parent.startWorker(__dirname + '/child.js', showError, atomConfig.typescriptServices ? [atomConfig.typescriptServices] : []);
}

export function stopWorker() {
    parent.stopWorker();
}

function showError(error: Error) {
    var message = "Failed to start a child TypeScript worker. Atom-TypeScript is disabled.";
    // Sad panda : https://github.com/TypeStrong/atom-typescript/issues/50
    if (process.platform === "win32") {
        message = message + " Make sure you have 'node' installed and available in your system path.";
    }
    atom.notifications.addError(message, { dismissable: true });

    if (error) {
        console.error('Failed to activate ts-worker:', error);
    }
}

/////////////////////////////////////// END INFRASTRUCTURE ////////////////////////////////////////////////////

/** Doesn't mess with any data. Just shows it nicely in the UI */
function catchCommonErrors<Query, Response>(func: workerLib.QRFunction<Query, Response>): workerLib.QRFunction<Query, Response> {
    return (q) => func(q).catch((err: Error) => {
        // Left only as a sample
        // We handle these errors elsewhere now
        /*if (err.message == tsconfig.errors.GET_PROJECT_JSON_PARSE_FAILED) {
            atom.notifications.addError('The tsconfig.json file for this TypeScript file contains invalid JSON');
        }*/
        return <any>Promise.reject(err);
    });
}

///ts:import=projectService
import projectService = require('../main/lang/projectService'); ///ts:import:generated

export var echo = catchCommonErrors(parent.sendToIpc(projectService.echo));
export var quickInfo = catchCommonErrors(parent.sendToIpc(projectService.quickInfo));
export var build = catchCommonErrors(parent.sendToIpc(projectService.build));
export var getCompletionsAtPosition = parent.sendToIpcOnlyLast(projectService.getCompletionsAtPosition, {
    completions: [],
    endsInPunctuation: false
});
export var emitFile = catchCommonErrors(parent.sendToIpc(projectService.emitFile));
export var formatDocument = catchCommonErrors(parent.sendToIpc(projectService.formatDocument));
export var formatDocumentRange = catchCommonErrors(parent.sendToIpc(projectService.formatDocumentRange));
export var getDefinitionsAtPosition = catchCommonErrors(parent.sendToIpc(projectService.getDefinitionsAtPosition));
export var updateText = catchCommonErrors(parent.sendToIpc(projectService.updateText));
export var editText = catchCommonErrors(parent.sendToIpc(projectService.editText));
export var errorsForFile = catchCommonErrors(parent.sendToIpc(projectService.errorsForFile));
export var getSignatureHelps = catchCommonErrors(parent.sendToIpc(projectService.getSignatureHelps));
export var getRenameInfo = catchCommonErrors(parent.sendToIpc(projectService.getRenameInfo));
export var getRelativePathsInProject = catchCommonErrors(parent.sendToIpc(projectService.getRelativePathsInProject));
export var debugLanguageServiceHostVersion = parent.sendToIpc(projectService.debugLanguageServiceHostVersion);
export var getProjectFileDetails = parent.sendToIpc(projectService.getProjectFileDetails);
export var getNavigationBarItems = parent.sendToIpc(projectService.getNavigationBarItems);
export var getSemtanticTree = parent.sendToIpc(projectService.getSemtanticTree);
export var getNavigateToItems = parent.sendToIpc(projectService.getNavigateToItems);
export var getReferences = parent.sendToIpc(projectService.getReferences);
export var getAST = parent.sendToIpc(projectService.getAST);
export var getASTFull = parent.sendToIpc(projectService.getASTFull);
export var getDependencies = parent.sendToIpc(projectService.getDependencies);
export var getQuickFixes = parent.sendToIpc(projectService.getQuickFixes);
export var applyQuickFix = parent.sendToIpc(projectService.applyQuickFix);
export var getOutput = parent.sendToIpc(projectService.getOutput);
export var getOutputJs = parent.sendToIpc(projectService.getOutputJs);
export var getOutputJsStatus = parent.sendToIpc(projectService.getOutputJsStatus);
export var softReset = parent.sendToIpc(projectService.softReset);
export var getRenameFilesRefactorings = parent.sendToIpc(projectService.getRenameFilesRefactorings);
export var createProject = parent.sendToIpc(projectService.createProject);
export var toggleBreakpoint = parent.sendToIpc(projectService.toggleBreakpoint);

// Automatically include all functions from "parentResponses" as responders
import queryParent = require('./queryParent');
parent.registerAllFunctionsExportedFromAsResponders(queryParent);
