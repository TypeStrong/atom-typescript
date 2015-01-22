var tsconfig = require('../tsconfig/index');
var ts = require('typescript');
var Program = (function () {
    function Program(project) {
        this.project = project;
        var host = ts.createCompilerHost(project.compilerOptions);
        this.tsProgram = ts.createProgram(project.files, project.compilerOptions, host);
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
    console.log(filePath);
    var projectFile = getOrCreateProject(filePath);
    if (programs[projectFile.projectFileDirectory]) {
        return programs[projectFile.projectFileDirectory];
    }
    else {
        return programs[projectFile.projectFileDirectory] = new Program(projectFile.project);
    }
}
exports.getOrCreateProgram = getOrCreateProgram;
