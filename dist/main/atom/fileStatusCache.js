;
var fileStatuses = {};
function getFileStatus(filePath) {
    if (!fileStatuses[filePath]) {
        fileStatuses[filePath] = { modified: false, saved: false };
    }
    return fileStatuses[filePath];
}
exports.getFileStatus = getFileStatus;
