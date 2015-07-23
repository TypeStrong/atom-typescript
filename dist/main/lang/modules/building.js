var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');
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
        sourceFileName: filePath,
        outputFiles: outputFiles,
        success: emitDone && !errors.length,
        errors: errors,
        emitError: !emitDone
    };
}
exports.emitFile = emitFile;
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
