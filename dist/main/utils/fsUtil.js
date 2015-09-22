function consistentPath(filePath) {
    return filePath.split('\\').join('/');
}
exports.consistentPath = consistentPath;
var path = require("path");
function resolve() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    return consistentPath(path.resolve.apply(path, args));
}
exports.resolve = resolve;
function isExt(path, ext) {
    return path && path.indexOf(ext, path.length - ext.length) !== -1;
}
exports.isExt = isExt;
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
