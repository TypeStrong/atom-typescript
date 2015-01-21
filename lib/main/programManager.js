var tsconfig = require('../tsconfig/index');
var ts = require('typescript');
function createTSCompilerOptions(options) {
    var tsCompilerOptions = {};
    options = options || {};
    tsCompilerOptions.declaration = options.declaration;
    return tsCompilerOptions;
}
var Program = (function () {
    function Program(project) {
        this.project = project;
        var tsCompilerOptions = createTSCompilerOptions(project.compilerOptions);
        var host = ts.createCompilerHost(tsCompilerOptions);
        this.tsProgram = ts.createProgram(project.files, tsCompilerOptions, host);
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
    var project = getOrCreateProject(filePath);
    if (programs[project.projectFileDirectory])
        return programs[project.projectFileDirectory];
    else
        return programs[project.projectFileDirectory] = new Program(project);
}
exports.getOrCreateProgram = getOrCreateProgram;
