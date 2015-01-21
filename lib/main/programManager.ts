///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

///ts:import=tsconfig
import tsconfig = require('../tsconfig/index'); ///ts:import:generated
import ts = require('typescript');

function createTSCompilerOptions(options:CompilerOptions):ts.CompilerOptions {
    var tsCompilerOptions: ts.CompilerOptions = {};
    options = options || {};
    tsCompilerOptions.declaration = options.declaration;

    return tsCompilerOptions;
}

export class Program {
    public tsProgram:ts.Program;

    constructor(public project: TypeScriptProjectSpecification) {
        var tsCompilerOptions = createTSCompilerOptions(project.compilerOptions);
        var host = ts.createCompilerHost(tsCompilerOptions);
        this.tsProgram = ts.createProgram(project.files, tsCompilerOptions, host);
    }
}

var programs: { [projectDir: string]: Program } = {}

function getOrCreateProject(filePath) {
    try {
        var project = tsconfig.getProjectSync(filePath);
        return project;
    } catch (ex) {
        return tsconfig.createProjectRootSync(filePath);
    }
}

export function getOrCreateProgram(filePath) {
    var project = getOrCreateProject(filePath);
    if (programs[project.projectFileDirectory]) return programs[project.projectFileDirectory];
    else return programs[project.projectFileDirectory] = new Program(project);
}
