///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

///ts:import=utils
import utils = require('../lang/utils'); ///ts:import:generated
///ts:import=project
import project = require('../lang/project'); ///ts:import:generated

import mainPanelView = require('./views/mainPanelView');
import lineMessageView = require('./views/lineMessageView');
import plainMessageView = require('./views/plainMessageView');
import atomUtils = require('./atomUtils');

import os = require('os')

export function start() {
    mainPanelView.attach();
    mainPanelView.panelView.setErrorPanelErrorCount(0, 0);
}

var filePathErrors: utils.Dict<project.TSError[]> = new utils.Dict<any[]>();

export var setErrors = (filePath: string, errorsForFile: project.TSError[]) => {
    if (!errorsForFile.length) filePathErrors.clearValue(filePath);
    else {
        // Currently we are limiting errors 
        // To many errors crashes our display
        if (errorsForFile.length > 50) errorsForFile = errorsForFile.slice(0, 50);
        
        filePathErrors.setValue(filePath, errorsForFile)
    };

    // TODO: this needs to be optimized at some point
    mainPanelView.panelView.clearError();

    var fileErrorCount = filePathErrors.keys().length;

    if (!fileErrorCount) {
        mainPanelView.panelView.setErrorPanelErrorCount(0, 0);
    }
    else {
        var totalErrorCount = 0;
        for (var path in filePathErrors.table) {
            filePathErrors.getValue(path).forEach((error: project.TSError) => {
                totalErrorCount++;
                mainPanelView.panelView.addError(new lineMessageView.LineMessageView({
                    message: error.message,
                    line: error.startPos.line + 1,
                    file: error.filePath,
                    preview: error.preview
                }));
            });
        }
        mainPanelView.panelView.setErrorPanelErrorCount(fileErrorCount, totalErrorCount);
    }
};

export function showEmittedMessage(output: project.EmitOutput) {
    if (output.success) {
        var message = 'TS emit succeeded';
        atomUtils.quickNotify(message);
    } else if (output.emitError) {
        atom.notifications.addError('TS Emit Failed');
    } else {
        atom.notifications.addWarning('Compile failed but emit succeeded:<br/>' + output.outputFiles.join('<br/>'));
    }
}
