///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

import childprocess = require('child_process');
var exec = childprocess.exec;
var spawn = childprocess.spawn;

import workerLib = require('./workerLib');
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

export var echo = parent.childQuery(projectService.echo);
export var quickInfo = parent.childQuery(projectService.quickInfo);
export var build = parent.childQuery(projectService.build);
export var errorsForFileFiltered = parent.childQuery(projectService.errorsForFileFiltered);
export var getCompletionsAtPosition = parent.childQuery(projectService.getCompletionsAtPosition);
export var emitFile = parent.childQuery(projectService.emitFile);
export var regenerateProjectGlob = parent.childQuery(projectService.regenerateProjectGlob);
export var formatDocument = parent.childQuery(projectService.formatDocument);
export var formatDocumentRange = parent.childQuery(projectService.formatDocumentRange);
export var getDefinitionsAtPosition = parent.childQuery(projectService.getDefinitionsAtPosition);
export var updateText = parent.childQuery(projectService.updateText);
export var errorsForFile = parent.childQuery(projectService.errorsForFile);
export var getSignatureHelps = parent.childQuery(projectService.getSignatureHelps);
export var getRenameInfo = parent.childQuery(projectService.getRenameInfo);
