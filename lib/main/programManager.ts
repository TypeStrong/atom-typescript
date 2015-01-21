///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

///ts:import=tsconfig
import tsconfig = require('../tsconfig/index'); ///ts:import:generated
import ts = require('typescript');


export class Program {
    public tsProgram:ts.Program;

    constructor(public project: tsconfig.TypeScriptProjectSpecification) {
        var host = ts.createCompilerHost(project.compilerOptions);
        this.tsProgram = ts.createProgram(project.files, project.compilerOptions, host);
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
