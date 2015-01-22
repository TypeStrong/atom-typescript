var tsconfig = require('../../tsconfig/index');
var languageServiceHost = require('./languageServiceHost');
var Program = (function () {
    function Program(projectFile) {
        this.projectFile = projectFile;
        var host = languageServiceHost.create(projectFile);
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
        return programs[projectFile.projectFileDirectory] = new Program(projectFile);
    }
}
exports.getOrCreateProgram = getOrCreateProgram;
