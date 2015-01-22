///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

import fs = require('fs');
import ts = require('typescript');

///ts:import=tsconfig
import tsconfig = require('../tsconfig/index'); ///ts:import:generated
import LanguageServiceHost = require('./languageServiceHost');

export class Program {
    public languageServiceHost: LanguageServiceHost;
    public languageService: ts.LanguageService;

    constructor(public projectFile: tsconfig.TypeScriptProjectFileDetails) {
        this.languageServiceHost = new LanguageServiceHost(projectFile);
        this.languageService = ts.createLanguageService(this.languageServiceHost, ts.createDocumentRegistry());

        // Since we only create a program per project once. Emit the first time 
        this.projectFile.project.files.forEach((filename) => this.emitFile(filename));
    }

    emitFile = (filename: string) => {
        var services = this.languageService;
        var output = services.getEmitOutput(filename);

        if (output.emitOutputStatus === ts.EmitReturnStatus.Succeeded) {
            console.log('SUCCESS ' + filename);
        }
        else {
            console.log('FAILURE ' + filename + ' emit');
            var allDiagnostics = services.getCompilerOptionsDiagnostics()
                .concat(services.getSyntacticDiagnostics(filename))
                .concat(services.getSemanticDiagnostics(filename));

            console.log(allDiagnostics);
            allDiagnostics.forEach(diagnostic => {
                if (!diagnostic.file) return; // TODO: happens only for 'lib.d.ts' for now

                console.log('diagnostic', diagnostic);
                var lineChar = diagnostic.file.getLineAndCharacterFromPosition(diagnostic.start);
                console.log(diagnostic.file && diagnostic.file.filename, lineChar.line, lineChar.character, diagnostic.messageText);
            });
        }

        output.outputFiles.forEach(o => {
            fs.writeFileSync(o.name, o.text, "utf8");
        });
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
    var projectFile = getOrCreateProject(filePath);
    if (programs[projectFile.projectFileDirectory]) {
        return programs[projectFile.projectFileDirectory];
    } else {
        return programs[projectFile.projectFileDirectory] = new Program(projectFile);
    }
}
