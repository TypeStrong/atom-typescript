var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');
var expand = require('glob-expand');
var projectFileName = 'tsproj.yml';
function getProjectsSync(pathOrSrcFile) {
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
    var parsedProjectSpecFile = yaml.safeLoad(fs.readFileSync(projectFile, 'utf8'));
    if (typeof parsedProjectSpecFile == "string")
        throw new Error("Invalid YAML");
    if (parsedProjectSpecFile.projects == void 0)
        throw new Error("Project file must have a 'projects' section");
    var validPropertyNames = ['sources', 'target', 'module', 'declaration', 'out', 'outDir', 'noImplicitAny', 'removeComments', 'sourceMap', 'sourceRoot', 'mapRoot'];
    var projects = [];
    var defaults = {};
    function parseProject(name, projectSpec) {
        var project = {};
        project.name = name;
        var cwdPath = path.relative(process.cwd(), path.dirname(projectFile));
        project.expandedSources = expand({ filter: 'isFile', cwd: cwdPath }, projectSpec.sources || []);
        project.sources = projectSpec.sources;
        project.target = projectSpec.target || 'es5';
        project.module = projectSpec.module || 'commonjs';
        project.declaration = projectSpec.declaration == void 0 ? false : projectSpec.declaration;
        runWithDefault(function (val) { return project.out = val; }, projectSpec.out);
        runWithDefault(function (val) { return project.outDir = val; }, projectSpec.outDir);
        project.noImplicitAny = projectSpec.noImplicitAny == void 0 ? false : projectSpec.noImplicitAny;
        project.removeComments = projectSpec.removeComments == void 0 ? true : projectSpec.removeComments;
        runWithDefault(function (val) { return project.sourceMap = val; }, projectSpec.sourceMap, false);
        runWithDefault(function (val) { return project.sourceRoot = val; }, projectSpec.sourceRoot);
        runWithDefault(function (val) { return project.mapRoot = val; }, projectSpec.mapRoot);
        return project;
    }
    if (parsedProjectSpecFile.defaults) {
        defaults = parseProject('defaults', parsedProjectSpecFile.defaults);
    }
    if (parsedProjectSpecFile.projects != void 0) {
        var projectSpecs = parsedProjectSpecFile.projects;
        Object.keys(projectSpecs).forEach(function (projectSpecName) {
            var projectSpec = projectSpecs[projectSpecName];
            projectSpec = extend(defaults, projectSpec);
            var parsed = parseProject(projectSpecName, projectSpec);
            projects.push(parsed);
        });
    }
    return {
        projectFileDirectory: path.dirname(projectFile) + path.sep,
        projects: projects
    };
}
exports.getProjectsSync = getProjectsSync;
function getProjectsForFileSync(file) {
    var projects = getProjectsSync(file);
    var foundProjects = [];
    projects.projects.forEach(function (project) {
        if (project.expandedSources.some(function (expandedPath) {
            if (path.normalize(projects.projectFileDirectory + expandedPath) == path.normalize(file))
                return true;
        })) {
            foundProjects.push(project);
        }
    });
    return {
        projectFileDirectory: projects.projectFileDirectory,
        projects: foundProjects
    };
}
exports.getProjectsForFileSync = getProjectsForFileSync;
function createProjectsRootSync(pathOrSrcFile, projectName, defaults) {
    if (projectName === void 0) { projectName = 'main'; }
    if (defaults === void 0) { defaults = {}; }
    if (!fs.existsSync(pathOrSrcFile))
        throw new Error('Project directory must exist');
    var dir = fs.lstatSync(pathOrSrcFile).isDirectory() ? pathOrSrcFile : path.dirname(pathOrSrcFile);
    var projectFilePath = path.normalize(dir + '/' + projectFileName);
    if (fs.existsSync(projectFilePath))
        throw new Error('Project file already exists');
    var mainProject = {};
    if (!defaults.sources)
        mainProject.sources = ['./**/*.ts'];
    var rawStructure = {
        defaults: defaults,
        projects: {}
    };
    rawStructure.projects[projectName] = mainProject;
    var encoded = yaml.safeDump(rawStructure);
    fs.writeFileSync(projectFilePath, encoded);
}
exports.createProjectsRootSync = createProjectsRootSync;
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
function extend(obj) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    var source, prop, ret = {};
    for (var p in obj) {
        ret[p] = obj[p];
    }
    for (var i = 1, length = arguments.length; i < length; i++) {
        source = arguments[i];
        for (prop in source) {
            if (source.hasOwnProperty(prop)) {
                ret[prop] = source[prop];
            }
        }
    }
    return ret;
}
;
