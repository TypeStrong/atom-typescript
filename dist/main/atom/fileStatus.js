var mainPanelView_1 = require("./views/mainPanelView");
exports.fileStatuses = [];
function updateFileStatus(filePath, status) {
    exports.fileStatuses[filePath] = status;
    mainPanelView_1.panelView.updateFileStatus(status);
}
exports.updateFileStatus = updateFileStatus;
