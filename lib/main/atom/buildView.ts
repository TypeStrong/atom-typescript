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
        title: 'TypeScript Build',
    });
}


export function setBuildOutput(buildOutput: programManager.BuildOutput) {
    start();

    // Only attach if there are some errors
    if (buildOutput.counts.errors) {
        messagePanel.attach();
    }

    messagePanel.clear();

    buildOutput.outputs.forEach(output => {
        if (output.success) {
            return;
        }
        output.errors.forEach(error => {
            messagePanel.add(new LineMessageView({
                message: error.message,
                line: error.startPos.line + 1,
                file: error.filePath,
                preview: error.preview
            }));
        });
    });

    if (!buildOutput.counts.errors) {
        messagePanel.add(new PlainMessageView({
            message: "Build Success",
            className: "text-success"
        }));
        atom.notifications.addSuccess("Build success");
    }
    else if (buildOutput.counts.emitErrors) {
        atom.notifications.addError("Emits errors: " + buildOutput.counts.emitErrors + " files.");
    } else {
        atom.notifications.addInfo('Compile failed but emit succeeded');
    }
}
