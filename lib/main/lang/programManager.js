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
            if (success) {
            }
            else {
                console.log('FAILURE ' + filePath + ' emit');
                var allDiagnostics = services.getCompilerOptionsDiagnostics().concat(services.getSyntacticDiagnostics(filePath)).concat(services.getSemanticDiagnostics(filePath));
                console.log(allDiagnostics);
                allDiagnostics.forEach(function (diagnostic) {
                    if (!diagnostic.file)
                        return;
                    var lineChar = diagnostic.file.getLineAndCharacterFromPosition(diagnostic.start);
                    console.log(diagnostic.file && diagnostic.file.filename, lineChar.line, lineChar.character, diagnostic.messageText);
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
        this.init();
    }
    Program.prototype.init = function () {
        var _this = this;
        this.projectFile.project.files.forEach(function (filename) { return _this.emitFile(filename); });
    };
    Program.prototype.formatDocument = function (filePath) {
        var textChanges = this.languageService.getFormattingEditsForDocument(filePath, defaultFormatCodeOptions());
        var formatted = this.formatCode(this.languageServiceHost.getScriptContent(filePath), textChanges);
        console.log(textChanges, this.languageServiceHost.getScriptContent(filePath), formatted);
        return formatted;
    };
    Program.prototype.formatDocumentRange = function (filePath, start, end) {
        var textChanges = this.languageService.getFormattingEditsForRange(filePath, start, end, defaultFormatCodeOptions());
        var formatted = this.formatCode(this.languageServiceHost.getScriptContent(filePath), textChanges);
        console.log(textChanges, formatted);
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
function getErrorsForFile(filePath) {
    var program = getOrCreateProgram(filePath);
    var diagnostics = program.languageService.getSyntacticDiagnostics(filePath);
    if (diagnostics.length === 0) {
        diagnostics = program.languageService.getSemanticDiagnostics(filePath);
    }
    return diagnostics.map(function (diagnostic) { return ({
        filePath: diagnostic.file.filename,
        startPos: program.languageServiceHost.getPositionFromIndex(filePath, diagnostic.start),
        endPos: program.languageServiceHost.getPositionFromIndex(filePath, diagnostic.length + diagnostic.start),
        message: diagnostic.messageText,
        preview: program.languageServiceHost.getScriptContent(filePath).substr(diagnostic.start, diagnostic.length),
    }); });
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
