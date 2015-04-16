///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

///ts:import=utils
import utils = require('../lang/utils'); ///ts:import:generated
///ts:import=project
import project = require('../lang/core/project'); ///ts:import:generated

import mainPanelView = require('./views/mainPanelView');
import lineMessageView = require('./views/lineMessageView');
import plainMessageView = require('./views/plainMessageView');
import atomUtils = require('./atomUtils');
import gotoHistory = require('./gotoHistory');

import os = require('os')

var filePathErrors: utils.Dict<TSError[]> = new utils.Dict<any[]>();

export var setErrors = (filePath: string, errorsForFile: TSError[]) => {
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

    // Update the errors list for goto history
    gotoHistory.errorsInOpenFiles.members = [];

    if (!fileErrorCount) {
        mainPanelView.panelView.setErrorPanelErrorCount(0, 0);
    }
    else {
        var totalErrorCount = 0;
        for (var path in filePathErrors.table) {
            filePathErrors.getValue(path).forEach((error: TSError) => {
                totalErrorCount++;
                mainPanelView.panelView.addError(new lineMessageView.LineMessageView({
                    goToLine: (filePath, line, col) => gotoHistory.gotoLine(filePath, line, col, gotoHistory.errorsInOpenFiles),
                    message: error.message,
                    line: error.startPos.line + 1,
                    col: error.startPos.col,
                    file: error.filePath,
                    preview: error.preview
                }));
                // Update the errors list for goto history
                gotoHistory.errorsInOpenFiles.members.push({ filePath: error.filePath, line: error.startPos.line + 1, col: error.startPos.col });
            });
        }
        mainPanelView.panelView.setErrorPanelErrorCount(fileErrorCount, totalErrorCount);
    }
};

export function showEmittedMessage(output: EmitOutput) {
    if (output.success) {
        var message = 'TS emit succeeded<br/>' + output.outputFiles.join('<br/>');
        atomUtils.quickNotifySuccess(message);
    } else if (output.emitError) {
        atom.notifications.addError('TS Emit Failed');
    } else {
        atomUtils.quickNotifyWarning('Compile failed but emit succeeded<br/>' + output.outputFiles.join('<br/>'));
    }
}
