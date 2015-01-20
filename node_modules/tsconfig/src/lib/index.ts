/// <reference path="../typings/vendor.d.ts"/>
/// <reference path="./interfaces.d.ts"/>

import fs = require('fs');
import path = require('path');
import yaml = require('js-yaml');
import expand = require('glob-expand');

var projectFileName = 'tsconfig.json';

export var defaults: CompilerOptions = {
    target: 'es5',
    module: 'commonjs',
    declaration: false,
    noImplicitAny: false,
    removeComments: true
};

/** Given an src (source file or directory) goes up the directory tree to find the project specifications. Use this to bootstrap the UI for what project the user might want to work on. */
export function getProjectSync(pathOrSrcFile: string): TypeScriptProjectFileDetails {

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
    try {
        var projectSpec: TypeScriptProjectSpecification = JSON.parse(fs.readFileSync(projectFile, 'utf8'));
    } catch (ex) {
        throw new Error("Invalid JSON");
    }
    
    // Setup default project options
    if (!projectSpec.compilerOptions) projectSpec.compilerOptions = {};
    
    // Use grunt.file.expand type of logic
    var cwdPath = path.relative(process.cwd(), path.dirname(projectFile));
    if (!projectSpec.files) projectSpec.filesGlob = ['./**/*.ts'];
    if (projectSpec.filesGlob) {
        projectSpec.files = expand({ filter: 'isFile', cwd: cwdPath }, projectSpec.filesGlob);
        fs.writeFileSync(projectFile, JSON.stringify(projectSpec));
    }


    // TODO: Validation


    // Setup with defaults: 
    projectSpec.compilerOptions.target = projectSpec.compilerOptions.target || defaults.target;
    projectSpec.compilerOptions.module = projectSpec.compilerOptions.module || defaults.module;
    projectSpec.compilerOptions.declaration = projectSpec.compilerOptions.declaration == void 0 ? defaults.declaration : projectSpec.compilerOptions.declaration;
    projectSpec.compilerOptions.noImplicitAny = projectSpec.compilerOptions.noImplicitAny == void 0 ? defaults.noImplicitAny : projectSpec.compilerOptions.noImplicitAny;
    projectSpec.compilerOptions.removeComments = projectSpec.compilerOptions.removeComments == void 0 ? defaults.removeComments : projectSpec.compilerOptions.removeComments;

    return {
        projectFileDirectory: path.dirname(projectFile) + path.sep,
        project: projectSpec
    };
}

/** Creates a project at the specified path (or by source file location). Defaults are assumed unless overriden by the optional spec. */
export function createProjectRootSync(pathOrSrcFile: string, defaultOptions?: CompilerOptions) {
    if (!fs.existsSync(pathOrSrcFile))
        throw new Error('Project directory must exist');

    // Get directory 
    var dir = fs.lstatSync(pathOrSrcFile).isDirectory() ? pathOrSrcFile : path.dirname(pathOrSrcFile);
    var projectFilePath = path.normalize(dir + '/' + projectFileName);

    if (fs.existsSync(projectFilePath))
        throw new Error('Project file already exists');

    // Setup a main project
    var projectSpec: TypeScriptProjectSpecification = {
        compilerOptions: defaultOptions || defaults
    };

    fs.writeFileSync(projectFilePath, JSON.stringify(projectSpec));
}
