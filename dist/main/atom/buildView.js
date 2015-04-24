var mainPanelView = require('./views/mainPanelView');
var lineMessageView = require('./views/lineMessageView');
var gotoHistory = require('./gotoHistory');
function getTitle(errorCount) {
    var title = '<span class="icon-circuit-board"></span> TypeScript Build';
    if (errorCount > 0) {
        title = title + (" (\n            <span class=\"text-highlight\" style=\"font-weight: bold\"> " + errorCount + " </span>\n            <span class=\"text-error\" style=\"font-weight: bold;\"> error" + (errorCount === 1 ? "" : "s") + " </span>\n        )");
    }
    return title;
}
function setBuildOutput(buildOutput) {
    mainPanelView.panelView.clearBuild();
    if (buildOutput.counts.errors) {
        mainPanelView.panelView.setBuildPanelCount(buildOutput.counts.errors);
    }
    else {
        mainPanelView.panelView.setBuildPanelCount(0);
    }
    gotoHistory.buildOutput.members = [];
    buildOutput.outputs.forEach(function (output) {
        if (output.success) {
            return;
        }
        output.errors.forEach(function (error) {
            mainPanelView.panelView.addBuild(new lineMessageView.LineMessageView({
                goToLine: function (filePath, line, col) { return gotoHistory.gotoLine(filePath, line, col, gotoHistory.buildOutput); },
                message: error.message,
                line: error.startPos.line + 1,
                col: error.startPos.col,
                file: error.filePath,
                preview: error.preview
            }));
            gotoHistory.buildOutput.members.push({ filePath: error.filePath, line: error.startPos.line + 1, col: error.startPos.col });
        });
    });
    if (!buildOutput.counts.errors) {
        atom.notifications.addSuccess("Build success");
    }
    else if (buildOutput.counts.emitErrors) {
        atom.notifications.addError("Emits errors: " + buildOutput.counts.emitErrors + " files.");
    }
    else {
        atom.notifications.addWarning('Compile failed but emit succeeded');
    }
}
exports.setBuildOutput = setBuildOutput;
