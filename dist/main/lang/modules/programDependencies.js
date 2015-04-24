var tsconfig_1 = require("../../tsconfig/tsconfig");
var path = require("path");
var fs = require("fs");
function getDependencies(projectFile, program) {
    var links = [];
    var projectDir = projectFile.projectFileDirectory;
    for (var _i = 0, _a = program.getSourceFiles(); _i < _a.length; _i++) {
        var file = _a[_i];
        var filePath = file.fileName;
        var dir = path.dirname(filePath);
        var targets = getSourceFileImports(file)
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
            var targetPath = tsconfig_1.consistentPath(path.relative(projectDir, tsconfig_1.consistentPath(target)));
            var sourcePath = tsconfig_1.consistentPath(path.relative(projectDir, filePath));
            links.push({
                sourcePath: sourcePath,
                targetPath: targetPath
            });
        }
    }
    return links;
}
exports.default = getDependencies;
function getSourceFileImports(srcFile) {
    var modules = [];
    getImports(srcFile, modules);
    return modules;
}
function getImports(searchNode, importedModules) {
    ts.forEachChild(searchNode, function (node) {
        if (node.kind === 209 || node.kind === 208 || node.kind === 215) {
            var moduleNameExpr = getExternalModuleName(node);
            if (moduleNameExpr && moduleNameExpr.kind === 8) {
                importedModules.push(moduleNameExpr.text);
            }
        }
        else if (node.kind === 205 && node.name.kind === 8) {
            getImports(node.body, importedModules);
        }
    });
}
function getExternalModuleName(node) {
    if (node.kind === 209) {
        return node.moduleSpecifier;
    }
    if (node.kind === 208) {
        var reference = node.moduleReference;
        if (reference.kind === 219) {
            return reference.expression;
        }
    }
    if (node.kind === 215) {
        return node.moduleSpecifier;
    }
}
