/**
 * Wraps fs and path into a nice "consistentPath" API
 */
function consistentPath(filePath) {
    return filePath.split('\\').join('/');
}
exports.consistentPath = consistentPath;
