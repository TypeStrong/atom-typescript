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
function rawToTsCompilerOptions(raw) {
    var lower = {};
    Object.keys(raw).forEach(function (key) {
        lower[key.toLowerCase()] = raw[key];
    });
    var proper = {};
    proper.target = lower.target == 'es3' ? ts.ScriptTarget.ES3 : lower.target == 'es5' ? ts.ScriptTarget.ES5 : lower.target == 'es6' ? ts.ScriptTarget.ES6 : exports.defaults.target;
    proper.module = lower.module == 'none' ? ts.ModuleKind.None : lower.module == 'commonjs' ? ts.ModuleKind.CommonJS : lower.module == 'amd' ? ts.ModuleKind.AMD : exports.defaults.module;
    proper.declaration = lower.declaration == void 0 ? exports.defaults.declaration : lower.declaration;
    proper.noImplicitAny = lower.noimplicitany == void 0 ? exports.defaults.noImplicitAny : lower.noimplicitany;
    proper.removeComments = lower.removecomments == void 0 ? exports.defaults.removeComments : lower.removecomments;
    return proper;
}
function tsToRawCompilerOptions(proper) {
    var raw = {};
    var targetLookup = {};
    targetLookup[ts.ScriptTarget.ES3] = 'es3';
    targetLookup[ts.ScriptTarget.ES5] = 'es5';
    targetLookup[ts.ScriptTarget.ES6] = 'es6';
    var moduleLookup = {};
    moduleLookup[ts.ModuleKind.None] = 'none';
    moduleLookup[ts.ModuleKind.CommonJS] = 'commonjs';
    moduleLookup[ts.ModuleKind.AMD] = 'amd';
    runWithDefault(function (val) { return raw.target = val; }, targetLookup[proper.target]);
    runWithDefault(function (val) { return raw.module = val; }, moduleLookup[proper.module]);
    runWithDefault(function (val) { return raw.declaration = val; }, proper.declaration);
    runWithDefault(function (val) { return raw.noimplicitany = val; }, proper.noImplicitAny);
    runWithDefault(function (val) { return raw.removecomments = val; }, proper.removeComments);
    return raw;
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
    project.compilerOptions = rawToTsCompilerOptions(projectSpec.compilerOptions);
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
    projectSpec.compilerOptions = tsToRawCompilerOptions(project.compilerOptions);
    fs.writeFileSync(projectFilePath, prettyJSON(projectSpec));
    return {
        projectFileDirectory: path.dirname(projectFilePath) + path.sep,
        project: project
    };
}
exports.createProjectRootSync = createProjectRootSync;
function runWithDefault(run, val, def) {
    if (val == void 0) {
        if (def != void 0) {
            run(def);
        }
    }
    else {
        run(val);
    }
}
function prettyJSON(object) {
    var cache = [];
    var value = JSON.stringify(object, function (key, value) {
        if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
                return;
            }
            cache.push(value);
        }
        return value;
    }, 4);
    cache = null;
    return value;
}
exports.prettyJSON = prettyJSON;
