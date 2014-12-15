/// <reference path="../typings/vendor.d.ts"/>
/// <reference path="./interfaces.d.ts"/>

import fs = require('fs');
import path = require('path');
import yaml = require('js-yaml');
import expand = require('glob-expand');

var projectFileName = 'tsproj.yml'

/** Given an src (source file or directory) goes up the directory tree to find all the project specifications. Use this to bootstrap the UI for what projects the user might want to work on. */
export function getProjectsSync(pathOrSrcFile: string): TypeScriptProjectFileDetails {

    if (!fs.existsSync(pathOrSrcFile))
        throw new Error('Invalid Path');

    // Get the path directory
    var dir = fs.lstatSync(pathOrSrcFile).isDirectory() ? pathOrSrcFile : path.dirname(pathOrSrcFile);

    // Keep going up till we find the project file 
    var projectFile = '';
    while (fs.existsSync(dir)) { // while directory exists

        var potentialProjectFile = dir + '/' + projectFileName;
        if (fs.existsSync(potentialProjectFile)) { // found it
            projectFile = potentialProjectFile;
            break;
        }
        else { // go up
            var before = dir;
            dir = path.dirname(dir);
            // At root: 
            if (dir == before) throw new Error('No Project Found');
        }
    }
    projectFile = path.normalize(projectFile);

    // We now have a valid projectFile. Parse it: 
    var parsedProjectSpecFile: TypeScriptProjectsRootSpecification = yaml.safeLoad(fs.readFileSync(projectFile, 'utf8'));
    if (typeof parsedProjectSpecFile == "string") throw new Error("Invalid YAML");
    if (parsedProjectSpecFile.projects == void 0) throw new Error("Project file must have a 'projects' section");

    // TODO: use these
    var validPropertyNames = ['sources', 'target', 'module', 'declaration', 'out', 'outDir', 'noImplicitAny', 'removeComments', 'sourceMap', 'sourceRoot', 'mapRoot'];

    // Setup for projects and root
    var projects: TypeScriptProjectSpecificationParsed[] = [];
    var defaults: TypeScriptProjectSpecificationParsed = <any>{};

    // Utility to add to projects
    function parseProject(name: string, projectSpec: TypeScriptProjectSpecification): TypeScriptProjectSpecificationParsed {
        var project: TypeScriptProjectSpecificationParsed = <any>{};
        project.name = name;
        // Use grunt.file.expand type of logic
        var cwdPath = path.relative(process.cwd(), path.dirname(projectFile));
        project.expandedSources = expand({ filter: 'isFile', cwd: cwdPath }, projectSpec.sources || []);

        // TODO: Validating
        // Setup with defaults: 
        project.sources = projectSpec.sources;
        project.target = projectSpec.target || 'es5';
        project.module = projectSpec.module || 'commonjs';
        project.declaration = projectSpec.declaration == void 0 ? false : projectSpec.declaration;
        runWithDefault(val => project.out = val, projectSpec.out);
        runWithDefault(val => project.outDir = val, projectSpec.outDir);
        project.noImplicitAny = projectSpec.noImplicitAny == void 0 ? false : projectSpec.noImplicitAny;
        project.removeComments = projectSpec.removeComments == void 0 ? true : projectSpec.removeComments;
        runWithDefault(val => project.sourceMap = val, projectSpec.sourceMap, false);
        runWithDefault(val => project.sourceRoot = val, projectSpec.sourceRoot);
        runWithDefault(val => project.mapRoot = val, projectSpec.mapRoot);

        return project;
    }

    // Load defaults
    if (parsedProjectSpecFile.defaults) {
        defaults = parseProject('defaults', parsedProjectSpecFile.defaults);
    }

    // Load sub projects
    if (parsedProjectSpecFile.projects != void 0) {
        var projectSpecs = parsedProjectSpecFile.projects;
        // For each key in parsedProjectSpec (project) we load the details. 
        Object.keys(projectSpecs).forEach((projectSpecName) => {
            var projectSpec: TypeScriptProjectSpecification = projectSpecs[projectSpecName];
            // Extend the default spec if any
            projectSpec = extend(defaults, projectSpec);
            // add to projects
            var parsed = parseProject(projectSpecName, projectSpec);
            projects.push(parsed);
        });
    }

    return {
        projectFileDirectory: path.dirname(projectFile) + path.sep,
        projects: projects
    };
}

/** Returns all the projects that have a particular source file in its sources. Use this for getting all the potential project compilations you need to run when a file changes. */
export function getProjectsForFileSync(file: string): TypeScriptProjectFileDetails {
    // First we get all the projects for path: 
    var projects = getProjectsSync(file);
    var foundProjects: TypeScriptProjectSpecificationParsed[] = [];

    // See if this path is in any of the expanded sources
    projects.projects.forEach(project => {
        if (project.expandedSources.some(expandedPath => {
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

/** Creates a project at the specified path (or by source file location). Defaults are assumed unless overriden by the optional spec. */
export function createProjectsRootSync(pathOrSrcFile: string, projectName: string = 'main', defaults: TypeScriptProjectSpecification = {}) {
    if (!fs.existsSync(pathOrSrcFile))
        throw new Error('Project directory must exist');

    // Get directory 
    var dir = fs.lstatSync(pathOrSrcFile).isDirectory() ? pathOrSrcFile : path.dirname(pathOrSrcFile);
    var projectFilePath = path.normalize(dir + '/' + projectFileName);

    if (fs.existsSync(projectFilePath))
        throw new Error('Project file already exists');

    // Setup a main project
    var mainProject: TypeScriptProjectSpecification = {
    };
    if (!defaults.sources) mainProject.sources = ['./**/*.ts'];

    // Setup the root spec using defaults
    var rawStructure: TypeScriptProjectsRootSpecification = {
        defaults: defaults,
        projects: {}
    };

    // add the main project
    rawStructure.projects[projectName] = mainProject;

    // Write it out
    var encoded = yaml.safeDump(rawStructure);
    fs.writeFileSync(projectFilePath, encoded);
}

/** Run with default if no val given or run with val */
function runWithDefault<T>(run: (val: T) => any, val: T, def?: T) {
    // no val
    if (val == void 0) {
        if (def != void 0) {
            run(def);
        }
    }
    else {
        run(val);
    }
}

/** from _.extend */
function extend(obj, ...args: any[]) {
    var source, prop, ret = {};
    // Shallow copy obj 
    for (var p in obj) {
        ret[p] = obj[p];
    }
    // Shallow copy from other args
    for (var i = 1, length = arguments.length; i < length; i++) {
        source = arguments[i];
        for (prop in source) {
            if (source.hasOwnProperty(prop)) {
                ret[prop] = source[prop];
            }
        }
    }
    return ret;
};