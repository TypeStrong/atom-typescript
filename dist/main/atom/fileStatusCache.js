;
var fileStatuses = {};
function getFileStatus(filePath) {
    if (!fileStatuses[filePath]) {
        fileStatuses[filePath] = { modified: false, saveSynced: false };
    }
    return fileStatuses[filePath];
}
exports.getFileStatus = getFileStatus;
