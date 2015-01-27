var MessagePanelView = require('atom-message-panel').MessagePanelView, LineMessageView = require('atom-message-panel').LineMessageView, PlainMessageView = require('atom-message-panel').PlainMessageView;
var messagePanel;
function start() {
    if (messagePanel)
        return;
    messagePanel = new MessagePanelView({
        title: 'TypeScript Build',
    });
    messagePanel.attach();
}
exports.start = start;
function setBuildOutput(buildOutput) {
    start();
    messagePanel.attach();
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
        atom.notifications.addInfo('Compile failed but emit succeeded');
    }
}
exports.setBuildOutput = setBuildOutput;
