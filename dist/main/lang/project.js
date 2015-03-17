var ts = require('typescript');
var path = require('path');
var mkdirp = require('mkdirp');
var fs = require('fs');
exports.languageServiceHost = require('./languageServiceHost2');
var utils = require('./utils');
var Project = (function () {
    function Project(projectFile) {
        var _this = this;
        this.projectFile = projectFile;
        this.emitFile = function (filePath) {
            var services = _this.languageService;
            var output = services.getEmitOutput(filePath);
            var emitDone = !output.emitSkipped;
            var errors = [];
            var allDiagnostics = services.getCompilerOptionsDiagnostics().concat(services.getSyntacticDiagnostics(filePath)).concat(services.getSemanticDiagnostics(filePath));
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
            var outputFiles = output.outputFiles.map(function (o) {
                return o.name;
            });
            if (path.extname(filePath) == '.d.ts') {
                outputFiles.push(filePath);
            }
            return {
                outputFiles: outputFiles,
                success: emitDone && !errors.length,
                errors: errors,
                emitError: !emitDone
            };
        };
        this.languageServiceHost = new exports.languageServiceHost.LanguageServiceHost(projectFile);
        this.languageService = ts.createLanguageService(this.languageServiceHost, ts.createDocumentRegistry());
    }
    Project.prototype.build = function () {
        var _this = this;
        var outputs = this.projectFile.project.files.map(function (filename) {
            return _this.emitFile(filename);
        });
        return {
            outputs: outputs,
            counts: {
                inputFiles: this.projectFile.project.files.length,
                outputFiles: utils.selectMany(outputs.map(function (out) {
                    return out.outputFiles;
                })).length,
                errors: utils.selectMany(outputs.map(function (out) {
                    return out.errors;
                })).length,
                emitErrors: outputs.filter(function (out) {
                    return out.emitError;
                }).length
            }
        };
    };
    Project.prototype.formatDocument = function (filePath, cursor) {
        var textChanges = this.languageService.getFormattingEditsForDocument(filePath, this.projectFile.project.formatCodeOptions);
        var formatted = this.formatCode(this.languageServiceHost.getScriptContent(filePath), textChanges);
        var newCursor = this.formatCursor(this.languageServiceHost.getIndexFromPosition(filePath, cursor), textChanges);
        return {
            formatted: formatted,
            cursor: this.languageServiceHost.getPositionFromIndex(filePath, newCursor)
        };
    };
    Project.prototype.formatDocumentRange = function (filePath, start, end) {
        var st = this.languageServiceHost.getIndexFromPosition(filePath, start);
        var ed = this.languageServiceHost.getIndexFromPosition(filePath, end);
        var textChanges = this.languageService.getFormattingEditsForRange(filePath, st, ed, this.projectFile.project.formatCodeOptions);
        textChanges.forEach(function (change) {
            return change.span = {
                start: change.span.start - st,
                length: change.span.length
            };
        });
        var formatted = this.formatCode(this.languageServiceHost.getScriptContent(filePath).substring(st, ed), textChanges);
        return formatted;
    };
    Project.prototype.formatCode = function (orig, changes) {
        var result = orig;
        for (var i = changes.length - 1; i >= 0; i--) {
            var change = changes[i];
            var head = result.slice(0, change.span.start);
            var tail = result.slice(change.span.start + change.span.length);
            result = head + change.newText + tail;
        }
        return result;
    };
    Project.prototype.formatCursor = function (cursor, changes) {
        var cursorInsideChange = changes.filter(function (change) {
            return (change.span.start < cursor) && ((change.span.start + change.span.length) > cursor);
        })[0];
        if (cursorInsideChange) {
            cursor = cursorInsideChange.span.start + cursorInsideChange.span.length;
        }
        var beforeCursorChanges = changes.filter(function (change) {
            return change.span.start < cursor;
        });
        var netChange = 0;
        beforeCursorChanges.forEach(function (change) {
            return netChange = netChange - (change.span.length - change.newText.length);
        });
        return cursor + netChange;
    };
    return Project;
})();
exports.Project = Project;
function diagnosticToTSError(diagnostic) {
    var filePath = diagnostic.file.fileName;
    var startPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    var endPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start + diagnostic.length);
    return {
        filePath: filePath,
        startPos: {
            line: startPosition.line,
            col: startPosition.character
        },
        endPos: {
            line: endPosition.line,
            col: endPosition.character
        },
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        preview: diagnostic.file.text.substr(diagnostic.start, diagnostic.length),
    };
}
exports.diagnosticToTSError = diagnosticToTSError;
//# sourceMappingURL=project.js.map