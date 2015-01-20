var fs = require('fs');
var path = require('path');
var expand = require('glob-expand');
var projectFileName = 'tsconfig.json';
exports.defaults = {
    target: 'es5',
    module: 'commonjs',
    declaration: false,
    noImplicitAny: false,
    removeComments: true
};
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
    projectSpec.compilerOptions.target = projectSpec.compilerOptions.target || exports.defaults.target;
    projectSpec.compilerOptions.module = projectSpec.compilerOptions.module || exports.defaults.module;
    projectSpec.compilerOptions.declaration = projectSpec.compilerOptions.declaration == void 0 ? exports.defaults.declaration : projectSpec.compilerOptions.declaration;
    projectSpec.compilerOptions.noImplicitAny = projectSpec.compilerOptions.noImplicitAny == void 0 ? exports.defaults.noImplicitAny : projectSpec.compilerOptions.noImplicitAny;
    projectSpec.compilerOptions.removeComments = projectSpec.compilerOptions.removeComments == void 0 ? exports.defaults.removeComments : projectSpec.compilerOptions.removeComments;
    return {
        projectFileDirectory: path.dirname(projectFile) + path.sep,
        project: projectSpec
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
    var projectSpec = {
        compilerOptions: defaultOptions || exports.defaults
    };
    fs.writeFileSync(projectFilePath, JSON.stringify(projectSpec));
}
exports.createProjectRootSync = createProjectRootSync;
