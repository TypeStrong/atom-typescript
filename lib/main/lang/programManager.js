var fs = require('fs');
var ts = require('typescript');
var tsconfig = require('../tsconfig/index');
var LanguageServiceHost = require('./languageServiceHost');
var Program = (function () {
    function Program(projectFile) {
        var _this = this;
        this.projectFile = projectFile;
        this.emitFile = function (filename) {
            var services = _this.languageService;
            var output = services.getEmitOutput(filename);
            if (output.emitOutputStatus === 0 /* Succeeded */) {
                console.log('SUCCESS ' + filename);
            }
            else {
                console.log('FAILURE ' + filename + ' emit');
                var allDiagnostics = services.getCompilerOptionsDiagnostics().concat(services.getSyntacticDiagnostics(filename)).concat(services.getSemanticDiagnostics(filename));
                console.log(allDiagnostics);
                allDiagnostics.forEach(function (diagnostic) {
                    if (!diagnostic.file)
                        return;
                    console.log('diagnostic', diagnostic);
                    var lineChar = diagnostic.file.getLineAndCharacterFromPosition(diagnostic.start);
                    console.log(diagnostic.file && diagnostic.file.filename, lineChar.line, lineChar.character, diagnostic.messageText);
                });
            }
            output.outputFiles.forEach(function (o) {
                fs.writeFileSync(o.name, o.text, "utf8");
            });
        };
        this.languageServiceHost = new LanguageServiceHost(projectFile);
        this.languageService = ts.createLanguageService(this.languageServiceHost, ts.createDocumentRegistry());
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
