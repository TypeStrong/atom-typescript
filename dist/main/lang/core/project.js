var fs = require('fs');
exports.languageServiceHost = require('./languageServiceHost2');
var tsconfig = require('../../tsconfig/tsconfig');
var transformerRegistry = require("../transformers/transformerRegistry");
var Project = (function () {
    function Project(projectFile) {
        var _this = this;
        this.projectFile = projectFile;
        this.languageServiceHost = new exports.languageServiceHost.LanguageServiceHost(projectFile);
        var transformerRegexes = transformerRegistry.getRegexes();
        projectFile.project.files.forEach(function (file) {
            if (tsconfig.endsWith(file, '.tst.ts')) {
                var rawContent = fs.readFileSync(tsconfig.removeExt(file), 'utf-8');
                var withoutTransform = rawContent;
                transformerRegexes.forEach(function (transformer) {
                    withoutTransform = withoutTransform.replace(transformer, '');
                    ;
                });
                _this.languageServiceHost.addScript(file, withoutTransform);
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
    Project.prototype.includesSourceFile = function (fileName) {
        return (this.getProjectSourceFiles().filter(function (f) { return f.fileName === fileName; }).length === 1);
    };
    return Project;
})();
exports.Project = Project;
