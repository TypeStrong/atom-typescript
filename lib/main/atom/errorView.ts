///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

///ts:import=programManager
import programManager = require('../lang/programManager'); ///ts:import:generated

import os = require('os')

var MessagePanelView = require('atom-message-panel').MessagePanelView,
    LineMessageView = require('atom-message-panel').LineMessageView,
    PlainMessageView = require('atom-message-panel').PlainMessageView;


var messagePanel;
export function start() {
    if (messagePanel) return; 
    messagePanel = new MessagePanelView({
        title: 'TypeScript Errors'
    });
    messagePanel.attach();
}

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

export function setErrors(errors: programManager.TSError[]) {
    messagePanel.clear();

    if (!errors.length) {
        messagePanel.add(new PlainMessageView({
            message: "No errors",
            className: "text-success"
        }));
    }
    else {
        errors.forEach((error) => {
            messagePanel.add(new LineMessageView({
                message: error.message,
                line: error.startPos.line + 1,
                preview: error.preview
            }));
        });
    }
}

export function showEmittedMessage(output: programManager.EmitOutput) {
    if (output.success) {
        var message = 'TS Emit: <br/>' + output.outputFiles.join('<br/>');
        atom.notifications.addSuccess(message);
    } else if (!output.outputFiles.length) {
        atom.notifications.addError('TS Emit Failed');
    } else {
        atom.notifications.addInfo('Compile failed but emit succeeded:<br/>' + output.outputFiles.join('<br/>'));
    }
}
