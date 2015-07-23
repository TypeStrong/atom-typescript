var path = require("path");
var tsconfig = require("../../tsconfig/tsconfig");
var utils = require("../utils");
var fuzzaldrin = require('fuzzaldrin');
function getExternalModuleNames(program) {
    var entries = [];
    program.getSourceFiles().forEach(function (sourceFile) {
        ts.forEachChild(sourceFile, function (child) {
            if (child.kind === ts.SyntaxKind.ModuleDeclaration && child.name.kind === ts.SyntaxKind.StringLiteral) {
                entries.push(child.name.text);
            }
        });
    });
    return entries;
}
function getPathCompletions(query) {
    var project = query.project;
    var sourceDir = path.dirname(query.filePath);
    var filePaths = project.projectFile.project.files.filter(function (p) { return p !== query.filePath; });
    var files = [];
    if (query.includeExternalModules) {
        var externalModules = getExternalModuleNames(project.languageService.getProgram());
        externalModules.forEach(function (e) { return files.push({
            name: "" + e,
            relativePath: e,
            fullPath: e
        }); });
    }
    filePaths.forEach(function (p) {
        files.push({
            name: path.basename(p, '.ts'),
            relativePath: tsconfig.removeExt(tsconfig.makeRelativePath(sourceDir, p)),
            fullPath: p
        });
    });
    var endsInPunctuation = utils.prefixEndsInPunctuation(query.prefix);
    if (!endsInPunctuation)
        files = fuzzaldrin.filter(files, query.prefix, { key: 'name' });
    var response = {
        files: files,
        endsInPunctuation: endsInPunctuation
    };
    return response;
}
exports.getPathCompletions = getPathCompletions;
