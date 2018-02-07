"use strict";
/**
 * Wraps fs and path into a nice "consistentPath" API
 */
Object.defineProperty(exports, "__esModule", { value: true });
function consistentPath(filePath) {
    return filePath.split("\\").join("/");
}
exports.consistentPath = consistentPath;
const path = require("path");
const fs = require("fs");
// Atom uses system dependent path separators while Typescript uses /. Unfortunately, we
// needs this to make sure things like lint errors work.
exports.systemPath = path.sep === "\\" ? filePath => filePath.replace(/\//g, "\\") : filePath => filePath;
// adapted from for fs-plus: check if a path is an existing file
function isFileSync(filePath) {
    if (!filePath || typeof filePath !== "string" || filePath.length < 1) {
        return false;
    }
    let stat;
    try {
        stat = fs.statSync(filePath);
    }
    catch (_a) {
        return false;
    }
    if (stat) {
        return stat.isFile();
    }
    else {
        return false;
    }
}
exports.isFileSync = isFileSync;
exports.readFileSync = fs.readFileSync;
exports.parsePath = path.parse;
//# sourceMappingURL=fs.js.map