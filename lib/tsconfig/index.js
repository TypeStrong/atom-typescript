var fs = require('fs');
var path = require('path');
var expand = require('glob-expand');
var ts = require('typescript');
var projectFileName = 'tsconfig.json';
exports.defaults = {
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS,
    declaration: false,
    noImplicitAny: false,
    removeComments: true
};
function createTSCompilerOptions(options) {
    var tsCompilerOptions = {};
    options = options || {};
    tsCompilerOptions.declaration = options.declaration;
    return tsCompilerOptions;
}
function getProjectSync(pathOrSrcFile) {
    if (!fs.existsSync(pathOrSrcFile))
        throw new Error('Invalid Path');
    var dir = fs.lstatSync(pathOrSrcFile).isDirectory() ? pathOrSrcFile : path.dirname(pathOrSrcFile);
    var projectFile = '';
    while (fs.existsSync(dir)) {
        var potentialProjectFile = dir + '/' + projectFileName;
        if (fs.existsSync(potentialProjectFile)) {
            projectFile = potentialProjectFile;
            break;
        }
        else {
            var before = dir;
            dir = path.dirname(dir);
            if (dir == before)
                throw new Error('No Project Found');
        }
    }
    projectFile = path.normalize(projectFile);
    try {
        var projectSpec = JSON.parse(fs.readFileSync(projectFile, 'utf8'));
    }
    catch (ex) {
        throw new Error("Invalid JSON");
    }
    if (!projectSpec.compilerOptions)
        projectSpec.compilerOptions = {};
    var cwdPath = path.relative(process.cwd(), path.dirname(projectFile));
    if (!projectSpec.files)
        projectSpec.filesGlob = ['./**/*.ts'];
    if (projectSpec.filesGlob) {
        projectSpec.files = expand({ filter: 'isFile', cwd: cwdPath }, projectSpec.filesGlob);
        fs.writeFileSync(projectFile, JSON.stringify(projectSpec));
    }
    var project = {
        compilerOptions: {},
        files: projectSpec.files
    };
    project.compilerOptions.target = projectSpec.compilerOptions.target == 'es3' ? ts.ScriptTarget.ES3 : projectSpec.compilerOptions.target == 'es5' ? ts.ScriptTarget.ES5 : projectSpec.compilerOptions.target == 'es6' ? ts.ScriptTarget.ES6 : exports.defaults.target;
    project.compilerOptions.module = projectSpec.compilerOptions.module == 'none' ? ts.ModuleKind.None : projectSpec.compilerOptions.module == 'commonjs' ? ts.ModuleKind.CommonJS : projectSpec.compilerOptions.module == 'amd' ? ts.ModuleKind.AMD : exports.defaults.module;
    project.compilerOptions.declaration = projectSpec.compilerOptions.declaration == void 0 ? exports.defaults.declaration : projectSpec.compilerOptions.declaration;
    project.compilerOptions.noImplicitAny = projectSpec.compilerOptions.noImplicitAny == void 0 ? exports.defaults.noImplicitAny : projectSpec.compilerOptions.noImplicitAny;
    project.compilerOptions.removeComments = projectSpec.compilerOptions.removeComments == void 0 ? exports.defaults.removeComments : projectSpec.compilerOptions.removeComments;
    return {
        projectFileDirectory: path.dirname(projectFile) + path.sep,
        project: project
    };
}
exports.getProjectSync = getProjectSync;
function createProjectRootSync(pathOrSrcFile, defaultOptions) {
    if (!fs.existsSync(pathOrSrcFile))
        throw new Error('Project directory must exist');
    var dir = fs.lstatSync(pathOrSrcFile).isDirectory() ? pathOrSrcFile : path.dirname(pathOrSrcFile);
    var projectFilePath = path.normalize(dir + '/' + projectFileName);
    if (fs.existsSync(projectFilePath))
        throw new Error('Project file already exists');
    var project = {
        compilerOptions: defaultOptions || exports.defaults
    };
    var projectSpec = {};
    fs.writeFileSync(projectFilePath, JSON.stringify(projectSpec));
    return {
        projectFileDirectory: path.dirname(projectFilePath) + path.sep,
        project: project
    };
}
exports.createProjectRootSync = createProjectRootSync;
