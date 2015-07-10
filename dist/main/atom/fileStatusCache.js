var path = require('path');
;
var fileStatuses = {};
function getFileStatus(filePath) {
    filePath = path.normalize(filePath);
    if (!fileStatuses[filePath]) {
        fileStatuses[filePath] = { modified: false, emitDiffers: false };
    }
    return fileStatuses[filePath];
}
exports.getFileStatus = getFileStatus;
