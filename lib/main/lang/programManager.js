var fs = require('fs');
var path = require('path');
var os = require('os');
var ts = require('typescript');
var tsconfig = require('../tsconfig/tsconfig');
var languageServiceHost = require('./languageServiceHost');
var utils = require('./utils');
var Program = (function () {
    function Program(projectFile) {
        var _this = this;
        this.projectFile = projectFile;
        this.emitFile = function (filePath) {
            var services = _this.languageService;
            var output = services.getEmitOutput(filePath);
            var success = output.emitOutputStatus === ts.EmitReturnStatus.Succeeded;
            var errors = [];
            if (success) {
            }
            else {
                console.log('FAILURE ' + filePath + ' emit');
                var allDiagnostics = services.getCompilerOptionsDiagnostics().concat(services.getSyntacticDiagnostics(filePath)).concat(services.getSemanticDiagnostics(filePath));
                allDiagnostics.forEach(function (diagnostic) {
                    if (!diagnostic.file)
                        return;
                    var startPosition = diagnostic.file.getLineAndCharacterFromPosition(diagnostic.start);
                    console.log(diagnostic.file.filename, startPosition.line, startPosition.character, diagnostic.messageText, diagnostic.code, diagnostic.isEarly);
                    errors.push(diagnosticToTSError(diagnostic));
                });
            }
            output.outputFiles.forEach(function (o) {
                fs.writeFileSync(o.name, o.text, "utf8");
            });
            var outputFiles = output.outputFiles.map(function (o) { return o.name; });
            if (path.extname(filePath) == '.d.ts') {
                outputFiles.push(filePath);
            }
            return {
                outputFiles: outputFiles,
                success: success,
                errors: errors,
                emitError: !success && outputFiles.length === 0
            };
        };
        this.languageServiceHost = new languageServiceHost.LanguageServiceHost(projectFile);
        this.languageService = ts.createLanguageService(this.languageServiceHost, ts.createDocumentRegistry());
    }
    Program.prototype.build = function () {
        var _this = this;
        var outputs = this.projectFile.project.files.map(function (filename) {
            return _this.emitFile(filename);
        });
        return {
            outputs: outputs,
            counts: {
                inputFiles: this.projectFile.project.files.length,
                outputFiles: utils.selectMany(outputs.map(function (out) { return out.outputFiles; })).length,
                errors: utils.selectMany(outputs.map(function (out) { return out.errors; })).length,
                emitErrors: outputs.filter(function (out) { return out.emitError; }).length
            }
        };
    };
    Program.prototype.formatDocument = function (filePath, cursor) {
        var textChanges = this.languageService.getFormattingEditsForDocument(filePath, defaultFormatCodeOptions());
        var formatted = this.formatCode(this.languageServiceHost.getScriptContent(filePath), textChanges);
        var newCursor = this.formatCursor(this.languageServiceHost.getIndexFromPosition(filePath, cursor), textChanges);
        this.languageServiceHost.updateScript(filePath, formatted);
        return { formatted: formatted, cursor: this.languageServiceHost.getPositionFromIndex(filePath, newCursor) };
    };
    Program.prototype.formatDocumentRange = function (filePath, start, end) {
        var st = this.languageServiceHost.getIndexFromPosition(filePath, start);
        var ed = this.languageServiceHost.getIndexFromPosition(filePath, end);
        var textChanges = this.languageService.getFormattingEditsForRange(filePath, st, ed, defaultFormatCodeOptions());
        textChanges.forEach(function (change) { return change.span = new ts.TextSpan(change.span.start() - st, change.span.length()); });
        var formatted = this.formatCode(this.languageServiceHost.getScriptContent(filePath).substring(st, ed), textChanges);
        return formatted;
    };
    Program.prototype.formatCode = function (orig, changes) {
        var result = orig;
        for (var i = changes.length - 1; i >= 0; i--) {
            var change = changes[i];
            var head = result.slice(0, change.span.start());
            var tail = result.slice(change.span.start() + change.span.length());
            result = head + change.newText + tail;
        }
        return result;
    };
    Program.prototype.formatCursor = function (cursor, changes) {
        var cursorInsideChange = changes.filter(function (change) { return (change.span.start() < cursor) && ((change.span.end()) > cursor); })[0];
        if (cursorInsideChange) {
            cursor = cursorInsideChange.span.end();
        }
        var beforeCursorChanges = changes.filter(function (change) { return change.span.start() < cursor; });
        var netChange = 0;
        beforeCursorChanges.forEach(function (change) { return netChange = netChange - (change.span.length() - change.newText.length); });
        return cursor + netChange;
    };
    return Program;
})();
exports.Program = Program;
var programByProjectPath = {};
var programByFilePath = {};
function getOrCreateProject(filePath) {
    try {
        var project = tsconfig.getProjectSync(filePath);
        return project;
    }
    catch (ex) {
        return tsconfig.createProjectRootSync(filePath);
    }
}
function getOrCreateProgram(filePath) {
    filePath = tsconfig.consistentPath(filePath);
    if (programByFilePath[filePath]) {
        return programByFilePath[filePath];
    }
    else {
        var projectFile = getOrCreateProject(filePath);
        if (programByProjectPath[projectFile.projectFileDirectory]) {
            return programByFilePath[filePath] = programByProjectPath[projectFile.projectFileDirectory];
        }
        else {
            var program = programByProjectPath[projectFile.projectFileDirectory] = new Program(projectFile);
            projectFile.project.files.forEach(function (file) { return programByFilePath[file] = program; });
            return program;
        }
    }
}
exports.getOrCreateProgram = getOrCreateProgram;
function diagnosticToTSError(diagnostic) {
    var filePath = diagnostic.file.filename;
    var startPosition = diagnostic.file.getLineAndCharacterFromPosition(diagnostic.start);
    var endPosition = diagnostic.file.getLineAndCharacterFromPosition(diagnostic.start + diagnostic.length);
    return {
        filePath: filePath,
        startPos: { line: startPosition.line - 1, ch: startPosition.character - 1 },
        endPos: { line: endPosition.line - 1, ch: endPosition.character - 1 },
        message: diagnostic.messageText,
        preview: diagnostic.file.text.substr(diagnostic.start, diagnostic.length),
    };
}
exports.diagnosticToTSError = diagnosticToTSError;
function getErrorsForFile(filePath) {
    var program = getOrCreateProgram(filePath);
    var diagnostics = program.languageService.getSyntacticDiagnostics(filePath);
    if (diagnostics.length === 0) {
        diagnostics = program.languageService.getSemanticDiagnostics(filePath);
    }
    return diagnostics.map(diagnosticToTSError);
}
exports.getErrorsForFile = getErrorsForFile;
function getErrorsForFileFiltered(filePath) {
    var fileName = path.basename(filePath);
    return getErrorsForFile(filePath).filter(function (error) { return path.basename(error.filePath) == fileName; });
}
exports.getErrorsForFileFiltered = getErrorsForFileFiltered;
function defaultFormatCodeOptions() {
    return {
        IndentSize: 4,
        TabSize: 4,
        NewLineCharacter: os.EOL,
        ConvertTabsToSpaces: true,
        InsertSpaceAfterCommaDelimiter: true,
        InsertSpaceAfterSemicolonInForStatements: true,
        InsertSpaceBeforeAndAfterBinaryOperators: true,
        InsertSpaceAfterKeywordsInControlFlowStatements: true,
        InsertSpaceAfterFunctionKeywordForAnonymousFunctions: false,
        InsertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
        PlaceOpenBraceOnNewLineForFunctions: false,
        PlaceOpenBraceOnNewLineForControlBlocks: false,
    };
}
exports.defaultFormatCodeOptions = defaultFormatCodeOptions;
