"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
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