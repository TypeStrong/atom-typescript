var utils = require('../lang/utils');
var mainPanelView = require('./views/mainPanelView');
var lineMessageView = require('./views/lineMessageView');
var plainMessageView = require('./views/plainMessageView');
function getTitle(fileErrorCount, totalErrorCount) {
    var title = '<span class="icon-bug"></span> TypeScript errors for open files';
    if (totalErrorCount > 0) {
        title = title + (" (\n            <span class=\"text-highlight\" style=\"font-weight: bold\"> " + fileErrorCount + " </span>\n            <span class=\"text-error\" style=\"font-weight: bold;\"> file" + (fileErrorCount === 1 ? "" : "s") + " </span>\n            <span class=\"text-highlight\" style=\"font-weight: bold\"> " + totalErrorCount + " </span>\n            <span class=\"text-error\" style=\"font-weight: bold;\"> error" + (totalErrorCount === 1 ? "" : "s") + " </span>\n        )");
    }
    return title;
}
function start() {
    mainPanelView.attach();
    mainPanelView.panelView.setTitle(getTitle(0, 0));
}
exports.start = start;
var filePathErrors = new utils.Dict();
exports.setErrors = function (filePath, errorsForFile) {
    if (!errorsForFile.length)
        filePathErrors.clearValue(filePath);
    else
        filePathErrors.setValue(filePath, errorsForFile);
    mainPanelView.panelView.clear();
    var fileErrorCount = filePathErrors.keys().length;
    if (!fileErrorCount) {
        mainPanelView.panelView.setTitle(getTitle(0, 0));
        mainPanelView.panelView.add(new plainMessageView.PlainMessageView({
            message: "No errors",
            className: "text-success"
        }));
    }
    else {
        var totalErrorCount = 0;
        for (var path in filePathErrors.table) {
            filePathErrors.getValue(path).forEach(function (error) {
                totalErrorCount++;
                mainPanelView.panelView.add(new lineMessageView.LineMessageView({
                    message: error.message,
                    line: error.startPos.line + 1,
                    file: path,
                    preview: error.preview
                }));
            });
        }
        var title = getTitle(fileErrorCount, totalErrorCount);
        mainPanelView.panelView.setTitle(title);
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
