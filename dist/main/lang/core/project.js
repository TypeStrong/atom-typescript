///ts:ref=globals
/// <reference path="../../../globals.ts"/> ///ts:ref:generated
var ts = require('typescript');
exports.languageServiceHost = require('./languageServiceHost2');
var Project = (function () {
    function Project(projectFile) {
        this.projectFile = projectFile;
        this.languageServiceHost = new exports.languageServiceHost.LanguageServiceHost(projectFile);
        this.languageService = ts.createLanguageService(this.languageServiceHost, ts.createDocumentRegistry());
    }
    Project.prototype.getProjectSourceFiles = function () {
        var files = this.languageService.getProgram().getSourceFiles().filter(function (x) {
            return x.fileName !== exports.languageServiceHost.defaultLibFile;
        });
        return files;
    };
    return Project;
})();
exports.Project = Project;
//# sourceMappingURL=project.js.map