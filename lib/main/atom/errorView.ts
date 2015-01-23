///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

///ts:import=programManager
import programManager = require('../lang/programManager'); ///ts:import:generated

var MessagePanelView = require('atom-message-panel').MessagePanelView,
    LineMessageView = require('atom-message-panel').LineMessageView,
    PlainMessageView = require('atom-message-panel').PlainMessageView;


var messagePanel;
export function start() {
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
            }));
        });
    }
}
