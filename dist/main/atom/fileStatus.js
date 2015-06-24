var mainPanelView_1 = require("./views/mainPanelView");
exports.fileStatuses = [];
function updateFileStatus(filePath, output) {
    var status;
    if (output.emitError) {
        status = 'error';
    }
    else {
        status = 'success';
    }
    exports.fileStatuses[filePath] = status;
    mainPanelView_1.panelView.updateFileStatus(status);
}
exports.updateFileStatus = updateFileStatus;
