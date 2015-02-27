///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

import childprocess = require('child_process');
var exec = childprocess.exec;
var spawn = childprocess.spawn;

import workerLib = require('./lib/workerLib');
import tsconfig = require('../main/tsconfig/tsconfig');


var parent = new workerLib.Parent();
export function startWorker() {
    parent.startWorker(__dirname + '/child.js', showError);
    console.log('AtomTS worker started')
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

///ts:import=projectService
import projectService = require('../main/lang/projectService'); ///ts:import:generated

export var echo = parent.sendToIpc(projectService.echo);
export var quickInfo = parent.sendToIpc(projectService.quickInfo);
export var build = parent.sendToIpc(projectService.build);
export var errorsForFileFiltered = parent.sendToIpc(projectService.errorsForFileFiltered);
export var getCompletionsAtPosition = parent.sendToIpc(projectService.getCompletionsAtPosition);
export var emitFile = parent.sendToIpc(projectService.emitFile);
export var regenerateProjectGlob = parent.sendToIpc(projectService.regenerateProjectGlob);
export var formatDocument = parent.sendToIpc(projectService.formatDocument);
export var formatDocumentRange = parent.sendToIpc(projectService.formatDocumentRange);
export var getDefinitionsAtPosition = parent.sendToIpc(projectService.getDefinitionsAtPosition);
export var updateText = parent.sendToIpc(projectService.updateText);
export var errorsForFile = parent.sendToIpc(projectService.errorsForFile);
export var getSignatureHelps = parent.sendToIpc(projectService.getSignatureHelps);
export var getRenameInfo = parent.sendToIpc(projectService.getRenameInfo);
export var getRelativePathsInProject = parent.sendToIpc(projectService.getRelativePathsInProject);

// Automatically include all functions from "parentResponses" as responders
import queryParent = require('./queryParent');
parent.registerAllFunctionsExportedFromAsResponders(queryParent);
