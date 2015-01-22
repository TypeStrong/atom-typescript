///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

///ts:import=tsconfig
import tsconfig = require('../../tsconfig/index'); ///ts:import:generated
///ts:import=languageServiceHost
import languageServiceHost = require('./languageServiceHost'); ///ts:import:generated

import ts = require('typescript');


export class Program {
    public tsLanguageService: ts.LanguageService;

    constructor(public projectFile: tsconfig.TypeScriptProjectFileDetails) {
        var host = languageServiceHost.create(projectFile);

        // this.tsProgram = ts.createProgram(project.files, project.compilerOptions, host);
        // TODO: create language service
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
        return programs[projectFile.projectFileDirectory] = new Program(projectFile);
    }
}
