var astUtils_1 = require("../fixmyts/astUtils");
var path = require("path");
var tsconfig_1 = require("../../tsconfig/tsconfig");
var fsUtil_1 = require("../../utils/fsUtil");
function getRenameFilesRefactorings(program, oldDirectoryOrFile, newDirectoryOrFile) {
    oldDirectoryOrFile = fsUtil_1.consistentPath(oldDirectoryOrFile);
    newDirectoryOrFile = fsUtil_1.consistentPath(newDirectoryOrFile);
    var oldFileNoExt = tsconfig_1.removeExt(oldDirectoryOrFile);
    var newFileNoExt = tsconfig_1.removeExt(newDirectoryOrFile);
    var refactorings = [];
    var sourceFiles = program.getSourceFiles();
    sourceFiles.forEach(function (sourceFile) {
        var imports = astUtils_1.getSourceFileImportsWithTextRange(sourceFile)
            .filter(function (fileReference) { return tsconfig_1.pathIsRelative(fileReference.text); })
            .map(function (ref) {
            return {
                path: fsUtil_1.consistentPath(path.resolve(path.dirname(sourceFile.fileName), ref.text)),
                range: ref.range
            };
        });
        var matches = imports.filter(function (f) { return f.path == oldFileNoExt; });
        if (matches.length) {
            for (var _i = 0; _i < matches.length; _i++) {
                var match = matches[_i];
                refactorings.push({
                    filePath: sourceFile.fileName,
                    span: {
                        start: match.range.pos,
                        length: match.range.end - match.range.pos
                    },
                    newText: tsconfig_1.makeRelativePath(path.dirname(sourceFile.fileName), newFileNoExt)
                });
            }
        }
    });
    return refactorings;
}
exports.getRenameFilesRefactorings = getRenameFilesRefactorings;
