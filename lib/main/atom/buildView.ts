

///ts:import=utils
import utils = require('../lang/utils'); ///ts:import:generated
///ts:import=project
import project = require('../lang/core/project'); ///ts:import:generated

import os = require('os')

import mainPanelView = require('./views/mainPanelView');
import lineMessageView = require('./views/lineMessageView');
import gotoHistory = require('./gotoHistory');

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


export function setBuildOutput(buildOutput: BuildOutput) {

    mainPanelView.panelView.clearBuild();

    if (buildOutput.counts.errors) {
        mainPanelView.panelView.setBuildPanelCount(buildOutput.counts.errors);
    }
    else {
        mainPanelView.panelView.setBuildPanelCount(0);
    }
    
    // Update the errors list for goto history
    gotoHistory.buildOutput.members = [];

    buildOutput.outputs.forEach(output => {
        if (output.success) {
            return;
        }
        output.errors.forEach(error => {
            mainPanelView.panelView.addBuild(new lineMessageView.LineMessageView({
                goToLine: (filePath, line, col) => gotoHistory.gotoLine(filePath, line, col, gotoHistory.buildOutput),
                message: error.message,
                line: error.startPos.line + 1,
                col: error.startPos.col,
                file: error.filePath,
                preview: error.preview
            }));
            // Update the errors list for goto history
            gotoHistory.buildOutput.members.push({ filePath: error.filePath, line: error.startPos.line + 1, col: error.startPos.col });
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
