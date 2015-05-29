var fs = require('fs');
exports.languageServiceHost = require('./languageServiceHost2');
var tsconfig = require('../../tsconfig/tsconfig');
var Project = (function () {
    function Project(projectFile) {
        var _this = this;
        this.projectFile = projectFile;
        this.languageServiceHost = new exports.languageServiceHost.LanguageServiceHost(projectFile);
        projectFile.project.files.forEach(function (file) {
            if (tsconfig.endsWith(file, '.tst.ts')) {
                var rawContent = fs.readFileSync(tsconfig.removeExt(file), 'utf-8');
                var withoutTranform = rawContent.replace(/transform:null{.*}transform:null/g, '');
                _this.languageServiceHost.addScript(file, rawContent);
            }
            else {
                _this.languageServiceHost.addScript(file);
            }
        });
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
