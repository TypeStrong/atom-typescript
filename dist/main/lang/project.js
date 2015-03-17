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