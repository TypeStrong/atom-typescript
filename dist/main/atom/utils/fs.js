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
// Atom uses system dependent path separators while Typescript uses /. Unfortunately, we
// needs this to make sure things like lint errors work.
exports.systemPath = path.sep === "\\" ? filePath => filePath.replace(/\//g, "\\") : filePath => filePath;
//# sourceMappingURL=fs.js.map