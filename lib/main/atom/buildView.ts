///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

///ts:import=utils
import utils = require('../lang/utils'); ///ts:import:generated
///ts:import=project
import project = require('../lang/project'); ///ts:import:generated

import os = require('os')

import mainPanelView = require('./views/mainPanelView');
import lineMessageView = require('./views/lineMessageView');

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


export function setBuildOutput(buildOutput: project.BuildOutput) {

    if (buildOutput.counts.errors) {        
        mainPanelView.panelView.setBuildPanelCount(buildOutput.counts.errors);
    }
    else {
        mainPanelView.panelView.setBuildPanelCount(0);
    }

    mainPanelView.panelView.clearBuild();

    buildOutput.outputs.forEach(output => {
        if (output.success) {
            return;
        }
        output.errors.forEach(error => {
            mainPanelView.panelView.addBuild(new lineMessageView.LineMessageView({
                message: error.message,
                line: error.startPos.line + 1,
                file: error.filePath,
                preview: error.preview
            }));
        });
    });

    if (!buildOutput.counts.errors) {
        atom.notifications.addSuccess("Build success");
    }
    else if (buildOutput.counts.emitErrors) {
        atom.notifications.addError("Emits errors: " + buildOutput.counts.emitErrors + " files.");
    } else {
        atom.notifications.addWarning('Compile failed but emit succeeded');
    }
}
