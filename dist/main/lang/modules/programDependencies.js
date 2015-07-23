var tsconfig_1 = require("../../tsconfig/tsconfig");
var fsUtil_1 = require("../../utils/fsUtil");
var path = require("path");
var fs = require("fs");
var astUtils_1 = require("../fixmyts/astUtils");
function getDependencies(projectFile, program) {
    var links = [];
    var projectDir = projectFile.projectFileDirectory;
    for (var _i = 0, _a = program.getSourceFiles(); _i < _a.length; _i++) {
        var file = _a[_i];
        var filePath = file.fileName;
        var dir = path.dirname(filePath);
        var targets = astUtils_1.getSourceFileImports(file)
            .filter(function (fileReference) { return tsconfig_1.pathIsRelative(fileReference); })
            .map(function (fileReference) {
            var file = path.resolve(dir, fileReference + '.ts');
            if (!fs.existsSync(file)) {
                file = path.resolve(dir, fileReference + '.d.ts');
            }
            return file;
        });
        for (var _b = 0; _b < targets.length; _b++) {
            var target = targets[_b];
            var targetPath = fsUtil_1.consistentPath(path.relative(projectDir, fsUtil_1.consistentPath(target)));
            var sourcePath = fsUtil_1.consistentPath(path.relative(projectDir, filePath));
            links.push({
                sourcePath: sourcePath,
                targetPath: targetPath
            });
        }
    }
    return links;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getDependencies;
