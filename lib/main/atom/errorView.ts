///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

///ts:import=utils
import utils = require('../lang/utils'); ///ts:import:generated
///ts:import=project
import project = require('../lang/project'); ///ts:import:generated

import mainPanelView = require('./views/mainPanelView');
import lineMessageView = require('./views/lineMessageView');
import plainMessageView = require('./views/plainMessageView');

import os = require('os')

function getTitle(fileErrorCount: number, totalErrorCount): string {
    var title = '<span class="icon-bug"></span> TypeScript errors for open files';
    if (totalErrorCount > 0) {
        title = title + ` (
            <span class="text-highlight" style="font-weight: bold"> ${fileErrorCount} </span>
            <span class="text-error" style="font-weight: bold;"> file${fileErrorCount === 1 ? "" : "s"} </span>
            <span class="text-highlight" style="font-weight: bold"> ${totalErrorCount} </span>
            <span class="text-error" style="font-weight: bold;"> error${totalErrorCount === 1 ? "" : "s"} </span>
        )`;
    }
    return title;
}

export function start() {
    mainPanelView.attach();
    mainPanelView.panelView.setTitle(getTitle(0, 0));
}

var filePathErrors: utils.Dict<project.TSError[]> = new utils.Dict<any[]>();

export var setErrors = (filePath: string, errorsForFile: project.TSError[]) => {
    if (!errorsForFile.length) filePathErrors.clearValue(filePath);
    else filePathErrors.setValue(filePath, errorsForFile);

    // TODO: this needs to be optimized at some point    
    mainPanelView.panelView.clear();

    var fileErrorCount = filePathErrors.keys().length;


    if (!fileErrorCount) {
        mainPanelView.panelView.setTitle(getTitle(0, 0));
        mainPanelView.panelView.add(new plainMessageView.PlainMessageView({
            message: "No errors",
            className: "text-success"
        }));
    }
    else {
        var totalErrorCount = 0;
        for (var path in filePathErrors.table) {
            filePathErrors.getValue(path).forEach((error) => {
                totalErrorCount++;
                mainPanelView.panelView.add(new lineMessageView.LineMessageView({
                    message: error.message,
                    line: error.startPos.line + 1,
                    file: path,
                    preview: error.preview
                }));
            });
        }
        var title = getTitle(fileErrorCount, totalErrorCount);
        mainPanelView.panelView.setTitle(title);
    }
};

export function showEmittedMessage(output: project.EmitOutput) {
    if (output.success) {
        var message = 'TS Emit: <br/>' + output.outputFiles.join('<br/>');
        atom.notifications.addSuccess(message);
    } else if (output.emitError) {
        atom.notifications.addError('TS Emit Failed');
    } else {
        atom.notifications.addWarning('Compile failed but emit succeeded:<br/>' + output.outputFiles.join('<br/>'));
    }
}
