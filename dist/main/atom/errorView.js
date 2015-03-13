var utils = require('../lang/utils');
var mainPanelView = require('./views/mainPanelView');
var lineMessageView = require('./views/lineMessageView');
var atomUtils = require('./atomUtils');
function start() {
    mainPanelView.attach();
    mainPanelView.panelView.setErrorPanelErrorCount(0, 0);
}
exports.start = start;
var filePathErrors = new utils.Dict();
exports.setErrors = function (filePath, errorsForFile) {
    if (!errorsForFile.length)
        filePathErrors.clearValue(filePath);
    else {
        if (errorsForFile.length > 50)
            errorsForFile = errorsForFile.slice(0, 50);
        filePathErrors.setValue(filePath, errorsForFile);
    }
    ;
    mainPanelView.panelView.clearError();
    var fileErrorCount = filePathErrors.keys().length;
    if (!fileErrorCount) {
        mainPanelView.panelView.setErrorPanelErrorCount(0, 0);
    }
    else {
        var totalErrorCount = 0;
        for (var path in filePathErrors.table) {
            filePathErrors.getValue(path).forEach(function (error) {
                totalErrorCount++;
                mainPanelView.panelView.addError(new lineMessageView.LineMessageView({
                    message: error.message,
                    line: error.startPos.line + 1,
                    file: error.filePath,
                    preview: error.preview
                }));
            });
        }
        mainPanelView.panelView.setErrorPanelErrorCount(fileErrorCount, totalErrorCount);
    }
};
function showEmittedMessage(output) {
    if (output.success) {
        var message = 'TS emit succeeded<br/>' + output.outputFiles.join('<br/>');
        atomUtils.quickNotifySuccess(message);
    }
    else if (output.emitError) {
        atom.notifications.addError('TS Emit Failed');
    }
    else {
        atomUtils.quickNotifyWarning('Compile failed but emit succeeded<br/>' + output.outputFiles.join('<br/>'));
    }
}
exports.showEmittedMessage = showEmittedMessage;
//# sourceMappingURL=errorView.js.map