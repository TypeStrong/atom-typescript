/**
 * Wraps fs and path into a nice "consistentPath" API
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function consistentPath(filePath) {
    return filePath.split('\\').join('/');
}
exports.consistentPath = consistentPath;
const path = require("path");
// Atom uses system dependent path separators while Typescript uses /. Unfortunately, we
// needs this to make sure things like lint errors work.
exports.systemPath = path.sep === "\\" ? filePath => filePath.replace(/\//g, "\\") : filePath => filePath;
/**
 * Resolves to to an absolute path.
 * @param from,to,to,to...
 */
function resolve(...args) {
    return consistentPath(path.resolve(...args));
}
exports.resolve = resolve;
/**
 * Converts "C:\boo" , "C:\boo\foo.ts" => "./foo.ts"; Works on unix as well.
 */
function makeRelativePath(relativeFolder, filePath) {
    var relativePath = path.relative(relativeFolder, filePath).split('\\').join('/');
    if (relativePath[0] !== '.') {
        relativePath = './' + relativePath;
    }
    return relativePath;
}
exports.makeRelativePath = makeRelativePath;
function removeExt(filePath) {
    return filePath.substr(0, filePath.lastIndexOf('.'));
}
exports.removeExt = removeExt;
//# sourceMappingURL=fs.js.map