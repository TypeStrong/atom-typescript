///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

///ts:import=utils
import utils = require('../lang/utils'); ///ts:import:generated
///ts:import=project
import project = require('../lang/project'); ///ts:import:generated

import os = require('os')

interface ILineMessageView { }

var MessagePanelView = require('atom-message-panel').MessagePanelView,
    LineMessageView: { new (config: any): ILineMessageView } = require('atom-message-panel').LineMessageView,
    PlainMessageView = require('atom-message-panel').PlainMessageView;

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

var messagePanel;
export function start() {
    if (messagePanel) return;
    messagePanel = new MessagePanelView({
        title: getTitle(0, 0),
        closeMethod: 'hide',
        rawTitle: true
    });
    messagePanel.attach();
    messagePanel.toggle(); // Start minized
}

var filePathErrors: utils.Dict<project.TSError[]> = new utils.Dict<any[]>();


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

export var setErrors = (filePath: string, errorsForFile: project.TSError[]) => {
    if (!errorsForFile.length) filePathErrors.clearValue(filePath);
    else filePathErrors.setValue(filePath, errorsForFile);

    // TODO: this needs to be optimized at some point
    messagePanel.clear();
    messagePanel.attach();

    var fileErrorCount = filePathErrors.keys().length;


    if (!fileErrorCount) {
        messagePanel.setTitle(getTitle(0, 0), true);
        messagePanel.add(new PlainMessageView({
            message: "No errors",
            className: "text-success"
        }));
    }
    else {
        var totalErrorCount = 0;
        for (var path in filePathErrors.table) {
            filePathErrors.getValue(path).forEach((error) => {
                totalErrorCount++;
                messagePanel.add(new LineMessageView({
                    message: error.message,
                    line: error.startPos.line + 1,
                    file: path,
                    preview: error.preview
                }));
            });
        }
        messagePanel.setTitle(getTitle(fileErrorCount, totalErrorCount), true);
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
