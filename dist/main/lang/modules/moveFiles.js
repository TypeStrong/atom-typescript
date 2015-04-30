/**
 * Gets the refactorings you would need if you move files around
 */
var astUtils_1 = require("../fixmyts/astUtils");
var path = require("path");
var tsconfig_1 = require("../../tsconfig/tsconfig");
function getRenameFilesRefactorings(program, oldDirectoryOrFile, newDirectoryOrFile) {
    oldDirectoryOrFile = tsconfig_1.consistentPath(oldDirectoryOrFile);
    newDirectoryOrFile = tsconfig_1.consistentPath(newDirectoryOrFile);
    var oldFileNoExt = tsconfig_1.removeExt(oldDirectoryOrFile);
    var refactorings = [];
    var sourceFiles = program.getSourceFiles();
    sourceFiles.forEach(function (sourceFile) {
        var imports = astUtils_1.getSourceFileImports(sourceFile)
            .filter(function (fileReference) { return tsconfig_1.pathIsRelative(fileReference); })
            .map(function (ref) { return tsconfig_1.consistentPath(path.resolve(path.dirname(sourceFile.fileName), ref)); });
        var matches = imports.filter(function (f) { return f == oldFileNoExt; });
        if (matches.length) {
            for (var _i = 0; _i < matches.length; _i++) {
                var match = matches[_i];
            }
        }
    });
    return refactorings;
}
exports.getRenameFilesRefactorings = getRenameFilesRefactorings;
