var utils = require('../lang/utils');
var MessagePanelView = require('atom-message-panel').MessagePanelView, LineMessageView = require('atom-message-panel').LineMessageView, PlainMessageView = require('atom-message-panel').PlainMessageView;
function getTitle(fileErrorCount, totalErrorCount) {
    var title = '<span class="icon-bug"></span> TypeScript errors for open files';
    if (totalErrorCount > 0) {
        title = title + (" (\n            <span class=\"text-highlight\" style=\"font-weight: bold\"> " + fileErrorCount + " </span>\n            <span class=\"text-error\" style=\"font-weight: bold;\"> file" + (fileErrorCount === 1 ? "" : "s") + " </span>\n            <span class=\"text-highlight\" style=\"font-weight: bold\"> " + totalErrorCount + " </span>\n            <span class=\"text-error\" style=\"font-weight: bold;\"> error" + (totalErrorCount === 1 ? "" : "s") + " </span>\n        )");
    }
    return title;
}
var messagePanel;
function start() {
    if (messagePanel)
        return;
    messagePanel = new MessagePanelView({
        title: getTitle(0, 0),
        closeMethod: 'hide',
        rawTitle: true
    });
    messagePanel.attach();
    messagePanel.toggle();
}
exports.start = start;
var filePathErrors = new utils.Dict();
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
exports.setErrors = function (filePath, errorsForFile) {
    if (!errorsForFile.length)
        filePathErrors.clearValue(filePath);
    else
        filePathErrors.setValue(filePath, errorsForFile);
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
            filePathErrors.getValue(path).forEach(function (error) {
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
function showEmittedMessage(output) {
    if (output.success) {
        var message = 'TS Emit: <br/>' + output.outputFiles.join('<br/>');
        atom.notifications.addSuccess(message);
    }
    else if (output.emitError) {
        atom.notifications.addError('TS Emit Failed');
    }
    else {
        atom.notifications.addWarning('Compile failed but emit succeeded:<br/>' + output.outputFiles.join('<br/>'));
    }
}
exports.showEmittedMessage = showEmittedMessage;
