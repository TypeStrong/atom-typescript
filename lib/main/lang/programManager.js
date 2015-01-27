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
            var success = output.emitOutputStatus === 0 /* Succeeded */;
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
        this.increaseProjectForReferenceAndImports = function () {
            var willNeedMoreAnalysis = function (file) {
                if (!_this.languageServiceHost.hasScript(file)) {
                    _this.languageServiceHost.addScript(file, fs.readFileSync(file).toString());
                    _this.projectFile.project.files.push(file);
                    return true;
                }
                else {
                    return false;
                }
            };
            var more = _this.getReferencedOrImportedFiles(_this.projectFile.project.files).filter(willNeedMoreAnalysis);
            while (more.length) {
                more = _this.getReferencedOrImportedFiles(_this.projectFile.project.files).filter(willNeedMoreAnalysis);
            }
        };
        this.getReferencedOrImportedFiles = function (files) {
            var referenced = [];
            files.forEach(function (file) {
                var preProcessedFileInfo = ts.preProcessFile(_this.languageServiceHost.getScriptContent(file), true), dir = path.dirname(file);
                referenced.push(preProcessedFileInfo.referencedFiles.map(function (fileReference) { return utils.pathResolve(dir, fileReference.filename); }).concat(preProcessedFileInfo.importedFiles.filter(function (fileReference) { return utils.pathIsRelative(fileReference.filename); }).map(function (fileReference) { return utils.pathResolve(dir, fileReference.filename + '.ts'); })));
            });
            return utils.selectMany(referenced);
        };
        this.languageServiceHost = new languageServiceHost.LanguageServiceHost(projectFile);
        this.languageService = ts.createLanguageService(this.languageServiceHost, ts.createDocumentRegistry());
        this.increaseProjectForReferenceAndImports();
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
    Program.prototype.formatDocument = function (filePath) {
        var textChanges = this.languageService.getFormattingEditsForDocument(filePath, defaultFormatCodeOptions());
        var formatted = this.formatCode(this.languageServiceHost.getScriptContent(filePath), textChanges);
        return formatted;
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
    return Program;
})();
exports.Program = Program;
var programs = {};
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
    var projectFile = getOrCreateProject(filePath);
    if (programs[projectFile.projectFileDirectory]) {
        return programs[projectFile.projectFileDirectory];
    }
    else {
        return programs[projectFile.projectFileDirectory] = new Program(projectFile);
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
