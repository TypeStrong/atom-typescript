///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

///ts:import=programManager
import programManager = require('../lang/programManager'); ///ts:import:generated
///ts:import=utils
import utils = require('../lang/utils'); ///ts:import:generated

import os = require('os')

interface ILineMessageView { }

var MessagePanelView = require('atom-message-panel').MessagePanelView,
    LineMessageView: { new (config: any): ILineMessageView } = require('atom-message-panel').LineMessageView,
    PlainMessageView = require('atom-message-panel').PlainMessageView;

var messagePanel;
export function start() {
    if (messagePanel) return;
    messagePanel = new MessagePanelView({
        title: 'TypeScript Errors (for open files)',
        closeMethod: 'hide'
    });
    messagePanel.attach();
    messagePanel.toggle(); // Start minized
}

var filePathErrors: utils.Dict<programManager.TSError[]> = new utils.Dict<any[]>();


// from : https://github.com/tcarlsen/atom-csslint/blob/master/lib/linter.coffee
function isHidden() {
    return messagePanel.summary.css("display") !== "none";
}
function show() {
    if (isHidden()) {
        messagePanel.toggle();
    }
}
function hide() {
    if (!isHidden()) {
        messagePanel.toggle();
    }
}

export var setErrors = (filePath: string, errorsForFile: programManager.TSError[]) => {
    if (!errorsForFile.length) filePathErrors.clearValue(filePath);
    else filePathErrors.setValue(filePath, errorsForFile);

    // TODO: this needs to be optimized at some point
    messagePanel.clear();
    messagePanel.attach();

    if (!filePathErrors.keys().length) {
        messagePanel.add(new PlainMessageView({
            message: "No errors",
            className: "text-success"
        }));
    }
    else {
        for (var path in filePathErrors.table) {
            filePathErrors.getValue(path).forEach((error) => {
                messagePanel.add(new LineMessageView({
                    message: error.message,
                    line: error.startPos.line + 1,
                    file: path,
                    preview: error.preview
                }));
            });
        }
    }
};

export function showEmittedMessage(output: programManager.EmitOutput) {
    if (output.success) {
        var message = 'TS Emit: <br/>' + output.outputFiles.join('<br/>');
        atom.notifications.addSuccess(message);
    } else if (output.emitError) {
        atom.notifications.addError('TS Emit Failed');
    } else {
        atom.notifications.addWarning('Compile failed but emit succeeded:<br/>' + output.outputFiles.join('<br/>'));
    }
}
