var ts = require('typescript');
var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');
var tsconfig_1 = require("../../tsconfig/tsconfig");
function diagnosticToTSError(diagnostic) {
    var filePath = diagnostic.file.fileName;
    var startPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    var endPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start + diagnostic.length);
    return {
        filePath: filePath,
        startPos: { line: startPosition.line, col: startPosition.character },
        endPos: { line: endPosition.line, col: endPosition.character },
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        preview: diagnostic.file.text.substr(diagnostic.start, diagnostic.length),
    };
}
exports.diagnosticToTSError = diagnosticToTSError;
function emitFile(proj, filePath) {
    var services = proj.languageService;
    var output = services.getEmitOutput(filePath);
    var emitDone = !output.emitSkipped;
    var errors = [];
    var allDiagnostics = services.getCompilerOptionsDiagnostics()
        .concat(services.getSyntacticDiagnostics(filePath))
        .concat(services.getSemanticDiagnostics(filePath));
    allDiagnostics.forEach(function (diagnostic) {
        if (!diagnostic.file)
            return;
        var startPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        errors.push(diagnosticToTSError(diagnostic));
    });
    output.outputFiles.forEach(function (o) {
        mkdirp.sync(path.dirname(o.name));
        fs.writeFileSync(o.name, o.text, "utf8");
    });
    var outputFiles = output.outputFiles.map(function (o) { return o.name; });
    if (path.extname(filePath) == '.d.ts') {
        outputFiles.push(filePath);
    }
    return {
        outputFiles: outputFiles,
        success: emitDone && !errors.length,
        errors: errors,
        emitError: !emitDone
    };
}
exports.emitFile = emitFile;
function getRawOutput(proj, filePath) {
    var services = proj.languageService;
    var output = services.getEmitOutput(filePath);
    return output;
}
exports.getRawOutput = getRawOutput;
var dts = require("../../tsconfig/dts-generator");
function emitDts(proj) {
    if (!proj.projectFile.project)
        return;
    if (!proj.projectFile.project.package)
        return;
    if (!proj.projectFile.project.package.directory)
        return;
    if (!proj.projectFile.project.package.definition)
        return;
    var outFile = path.resolve(proj.projectFile.project.package.directory, './', proj.projectFile.project.package.definition);
    var baseDir = proj.projectFile.project.package.directory;
    var name = proj.projectFile.project.package.name;
    var main = proj.projectFile.project.package.main;
    if (main) {
        main = name + '/' + tsconfig_1.consistentPath(main.replace('./', ''));
        main = main.replace(/\.*.js$/g, '');
    }
    var externs = proj.projectFile.project.typings;
    var files = proj.projectFile.project.files;
    dts.generate({
        baseDir: baseDir,
        files: files,
        externs: externs,
        name: name,
        target: proj.projectFile.project.compilerOptions.target,
        out: outFile,
        main: main,
        outDir: proj.projectFile.project.compilerOptions.outDir
    });
}
exports.emitDts = emitDts;
