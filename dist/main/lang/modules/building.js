"use strict";
var path = require("path");
var fsUtil_1 = require("../../utils/fsUtil");
var findup = require('findup');
exports.Not_In_Context = "/* NotInContext */";
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
function getRawOutput(proj, filePath) {
    var services = proj.languageService;
    var output;
    if (proj.includesSourceFile(filePath)) {
        output = services.getEmitOutput(filePath);
    }
    else {
        output = {
            outputFiles: [{ name: filePath, text: exports.Not_In_Context, writeByteOrderMark: false }],
            emitSkipped: true
        };
    }
    return output;
}
exports.getRawOutput = getRawOutput;
function isJSFile(fileName) {
    return (path.extname(fileName).toLocaleLowerCase() === ".js");
}
function isJSSourceMapFile(fileName) {
    var lastExt = path.extname(fileName);
    if (lastExt === ".map") {
        return isJSFile(fileName.substr(0, fileName.length - 4));
    }
    return false;
}
var dts = require("../../tsconfig/dts-generator");
function emitDts(proj) {
    if (!proj.projectFile.project)
        return;
    if (proj.projectFile.project.compilerOptions.outFile)
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
        main = name + '/' + fsUtil_1.consistentPath(main.replace('./', ''));
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
