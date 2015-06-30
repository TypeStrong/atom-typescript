;
var fileStatuses = {};
function getFileStatus(filePath) {
    if (!fileStatuses[filePath]) {
        fileStatuses[filePath] = { modified: false, emitDiffers: false };
    }
    return fileStatuses[filePath];
}
exports.getFileStatus = getFileStatus;
