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

function getTitle(errorCount: number): string {
    var title = '<span class="icon-circuit-board"></span> TypeScript Build';
    if (errorCount > 0) {
        title = title + ` (
            <span class="text-highlight" style="font-weight: bold"> ${errorCount} </span>
            <span class="text-error" style="font-weight: bold;"> error${errorCount === 1 ? "" : "s"} </span>
        )`;
    }
    return title;
}


var messagePanel;
export function start() {
    if (messagePanel) return;
    messagePanel = new MessagePanelView({
        title: getTitle(0),
        closeMethod: 'hide',
        rawTitle: true,
    });
}


export function setBuildOutput(buildOutput: project.BuildOutput) {
    start();

    if (buildOutput.counts.errors) {
        messagePanel.attach(); // Only attach if there are some errors
        messagePanel.setTitle(getTitle(buildOutput.counts.errors), true);
    }
    else {
        messagePanel.setTitle(getTitle(0), true);
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
        atom.notifications.addWarning('Compile failed but emit succeeded');
    }
}
