"use strict";
/**
 * We keep an in memory cache of certain knowledge points regarding a few file paths
 * This file maintains that
 */
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
