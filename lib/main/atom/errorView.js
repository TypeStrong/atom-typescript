var utils = require('../lang/utils');
var MessagePanelView = require('atom-message-panel').MessagePanelView, LineMessageView = require('atom-message-panel').LineMessageView, PlainMessageView = require('atom-message-panel').PlainMessageView;
var messagePanel;
function start() {
    if (messagePanel)
        return;
    messagePanel = new MessagePanelView({
        title: 'TypeScript Errors (for open files)',
        closeMethod: 'hide'
    });
    messagePanel.attach();
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
function setErrors(filePath, errorsForFile) {
    if (!errorsForFile.length)
        filePathErrors.clearValue(filePath);
    else
        filePathErrors.setValue(filePath, errorsForFile);
    messagePanel.clear();
    messagePanel.attach();
    if (!filePathErrors.keys().length) {
        messagePanel.add(new PlainMessageView({
            message: "No errors",
            className: "text-success"
        }));
    }
    else {
        for (var path in filePathErrors.table) {
            filePathErrors.getValue(path).forEach(function (error) {
                messagePanel.add(new LineMessageView({
                    message: error.message,
                    line: error.startPos.line + 1,
                    file: path,
                    preview: error.preview
                }));
            });
        }
    }
}
exports.setErrors = setErrors;
function showEmittedMessage(output) {
    if (output.success) {
        var message = 'TS Emit: <br/>' + output.outputFiles.join('<br/>');
        atom.notifications.addSuccess(message);
    }
    else if (output.emitError) {
        atom.notifications.addError('TS Emit Failed');
    }
    else {
        atom.notifications.addInfo('Compile failed but emit succeeded:<br/>' + output.outputFiles.join('<br/>'));
    }
}
exports.showEmittedMessage = showEmittedMessage;
