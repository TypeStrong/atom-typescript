var tsconfig_1 = require("../../tsconfig/tsconfig");
var ts = require("typescript");
var path = require("path");
var fs = require("fs");
function getDependencies(projectFile, program) {
    var links = [];
    var projectDir = projectFile.projectFileDirectory;
    for (var _i = 0, _a = program.getSourceFiles(); _i < _a.length; _i++) {
        var file = _a[_i];
        var content = file.getText();
        var filePath = file.fileName;
        var preProcessedFileInfo = ts.preProcessFile(content, true), dir = path.dirname(filePath);
        var targets = preProcessedFileInfo.importedFiles
            .filter(function (fileReference) { return tsconfig_1.pathIsRelative(fileReference.fileName); })
            .map(function (fileReference) {
            var file = path.resolve(dir, fileReference.fileName + '.ts');
            if (!fs.existsSync(file)) {
                file = path.resolve(dir, fileReference.fileName + '.d.ts');
            }
            return file;
        });
        for (var _b = 0; _b < targets.length; _b++) {
            var target = targets[_b];
            var targetPath = path.relative(projectDir, tsconfig_1.consistentPath(target));
            var sourcePath = path.relative(projectDir, filePath);
            links.push({
                sourcePath: sourcePath,
                targetPath: targetPath
            });
        }
    }
    return links;
}
exports.default = getDependencies;
