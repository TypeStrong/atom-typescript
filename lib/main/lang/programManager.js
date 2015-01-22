var fs = require('fs');
var path = require('path');
var ts = require('typescript');
var tsconfig = require('../tsconfig/index');
var LanguageServiceHost = require('./languageServiceHost');
var utils = require('./utils');
var Program = (function () {
    function Program(projectFile) {
        var _this = this;
        this.projectFile = projectFile;
        this.emitFile = function (filename) {
            var services = _this.languageService;
            var output = services.getEmitOutput(filename);
            if (output.emitOutputStatus === ts.EmitReturnStatus.Succeeded) {
                console.log('SUCCESS ' + filename);
            }
            else {
                console.log('FAILURE ' + filename + ' emit');
                var allDiagnostics = services.getCompilerOptionsDiagnostics().concat(services.getSyntacticDiagnostics(filename)).concat(services.getSemanticDiagnostics(filename));
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
        this.languageServiceHost = new LanguageServiceHost(projectFile);
        this.languageService = ts.createLanguageService(this.languageServiceHost, ts.createDocumentRegistry());
        this.increaseProjectForReferenceAndImports();
        this.projectFile.project.files.forEach(function (filename) { return _this.emitFile(filename); });
    }
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
