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

function getOrCreateProject(filePath): tsconfig.TypeScriptProjectFileDetails {
    try {
        var project = tsconfig.getProjectSync(filePath);
        return project;
    } catch (ex) {
        return tsconfig.createProjectRootSync(filePath);
    }
}

export function getOrCreateProgram(filePath) {
    console.log(filePath);
    var projectFile = getOrCreateProject(filePath);
    if (programs[projectFile.projectFileDirectory]) {
        return programs[projectFile.projectFileDirectory];
    } else {
        return programs[projectFile.projectFileDirectory] = new Program(projectFile.project);
    }
}
