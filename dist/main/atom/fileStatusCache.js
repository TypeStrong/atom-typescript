"use strict";
const fsUtil_1 = require("../utils/fsUtil");
;
let fileStatuses = {};
function getFileStatus(filePath) {
    filePath = fsUtil_1.consistentPath(filePath);
    if (!fileStatuses[filePath]) {
        fileStatuses[filePath] = { modified: false, emitDiffers: false };
    }
    return fileStatuses[filePath];
}
exports.getFileStatus = getFileStatus;
