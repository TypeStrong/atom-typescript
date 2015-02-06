var MessagePanelView = require('atom-message-panel').MessagePanelView, LineMessageView = require('atom-message-panel').LineMessageView, PlainMessageView = require('atom-message-panel').PlainMessageView;
function getTitle(errorCount) {
    var title = '<span class="icon-circuit-board"></span> TypeScript Build';
    if (errorCount > 0) {
        title = title + (" (\n            <span class=\"text-highlight\" style=\"font-weight: bold\"> " + errorCount + " </span>\n            <span class=\"text-error\" style=\"font-weight: bold;\"> error" + (errorCount === 1 ? "" : "s") + " </span>\n        )");
    }
    return title;
}
var messagePanel;
function start() {
    if (messagePanel)
        return;
    messagePanel = new MessagePanelView({
        title: getTitle(0),
        closeMethod: 'hide',
        rawTitle: true,
    });
}
exports.start = start;
function setBuildOutput(buildOutput) {
    start();
    if (buildOutput.counts.errors) {
        messagePanel.attach();
        messagePanel.setTitle(getTitle(buildOutput.counts.errors), true);
    }
    else {
        messagePanel.setTitle(getTitle(0), true);
    }
    messagePanel.clear();
    buildOutput.outputs.forEach(function (output) {
        if (output.success) {
            return;
        }
        output.errors.forEach(function (error) {
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
    }
    else {
        atom.notifications.addWarning('Compile failed but emit succeeded');
    }
}
exports.setBuildOutput = setBuildOutput;
