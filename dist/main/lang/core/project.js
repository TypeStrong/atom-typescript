exports.languageServiceHost = require('./languageServiceHost2');
var Project = (function () {
    function Project(projectFile) {
        this.projectFile = projectFile;
        this.languageServiceHost = new exports.languageServiceHost.LanguageServiceHost(projectFile);
        this.languageService = ts.createLanguageService(this.languageServiceHost, ts.createDocumentRegistry());
    }
    Project.prototype.getProjectSourceFiles = function () {
        var libFile = exports.languageServiceHost.getDefaultLibFilePath(this.projectFile.project.compilerOptions);
        var files = this.languageService.getProgram().getSourceFiles().filter(function (x) { return x.fileName !== libFile; });
        return files;
    };
    return Project;
})();
exports.Project = Project;
