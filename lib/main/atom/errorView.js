var MessagePanelView = require('atom-message-panel').MessagePanelView, LineMessageView = require('atom-message-panel').LineMessageView, PlainMessageView = require('atom-message-panel').PlainMessageView;
var messagePanel;
function start() {
    messagePanel = new MessagePanelView({
        title: 'TypeScript Errors'
    });
    messagePanel.attach();
}
exports.start = start;
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
function setErrors(errors) {
    messagePanel.clear();
    if (!errors.length) {
        messagePanel.add(new PlainMessageView({
            message: "No errors",
            className: "text-success"
        }));
    }
    else {
        errors.forEach(function (error) {
            messagePanel.add(new LineMessageView({
                message: error.message,
                line: error.startPos.line + 1,
            }));
        });
    }
}
exports.setErrors = setErrors;
function showEmittedMessage() {
    messagePanel.add(new PlainMessageView({
        message: "JS Emitted",
        className: "text-success"
    }));
}
exports.showEmittedMessage = showEmittedMessage;
