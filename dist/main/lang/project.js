var ts = require('typescript');
exports.languageServiceHost = require('./languageServiceHost2');
var Project = (function () {
    function Project(projectFile) {
        this.projectFile = projectFile;
        this.languageServiceHost = new exports.languageServiceHost.LanguageServiceHost(projectFile);
        this.languageService = ts.createLanguageService(this.languageServiceHost, ts.createDocumentRegistry());
    }
    return Project;
})();
exports.Project = Project;
//# sourceMappingURL=project.js.map