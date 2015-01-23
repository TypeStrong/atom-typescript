///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

import fs = require('fs');
import path = require('path');
import ts = require('typescript');

import tsconfig = require('../tsconfig/tsconfig');
import languageServiceHost = require('./languageServiceHost');
import utils = require('./utils');

export class Program {
    public languageServiceHost: languageServiceHost.LanguageServiceHost;
    public languageService: ts.LanguageService;

    constructor(public projectFile: tsconfig.TypeScriptProjectFileDetails) {
        this.languageServiceHost = new languageServiceHost.LanguageServiceHost(projectFile);
        this.languageService = ts.createLanguageService(this.languageServiceHost, ts.createDocumentRegistry());

        // Now using the language service we need to get all the referenced files and add them back to the project
        this.increaseProjectForReferenceAndImports();

        this.init();
    }

    private init() {
        // Since we only create a program per project once. Emit the first time
        this.projectFile.project.files.forEach((filename) => this.emitFile(filename));
    }

    emitFile = (filename: string): EmitOutput => {
        var services = this.languageService;
        var output = services.getEmitOutput(filename);
        var success = output.emitOutputStatus === ts.EmitReturnStatus.Succeeded;


        if (success) {
            // console.log('SUCCESS ' + filename);
        }
        else {
            console.log('FAILURE ' + filename + ' emit');
            var allDiagnostics = services.getCompilerOptionsDiagnostics()
                .concat(services.getSyntacticDiagnostics(filename))
                .concat(services.getSemanticDiagnostics(filename));

            console.log(allDiagnostics);
            allDiagnostics.forEach(diagnostic => {
                if (!diagnostic.file) return; // TODO: happens only for 'lib.d.ts' for now

                var lineChar = diagnostic.file.getLineAndCharacterFromPosition(diagnostic.start);
                console.log(diagnostic.file && diagnostic.file.filename, lineChar.line, lineChar.character, diagnostic.messageText);
            });
        }

        output.outputFiles.forEach(o => {
            fs.writeFileSync(o.name, o.text, "utf8");
        });

        var outputFiles = output.outputFiles.map((o) => o.name);
        if (path.extname(filename) == '.d.ts') {
            outputFiles.push(filename);
        }

        return {
            outputFiles: outputFiles,
            success: success,
        }
    }

    // TODO: push this to use regex and into tsconfig
    increaseProjectForReferenceAndImports = () => {

        var willNeedMoreAnalysis = (file: string) => {
            if (!this.languageServiceHost.hasScript(file)) {
                this.languageServiceHost.addScript(file, fs.readFileSync(file).toString());
                this.projectFile.project.files.push(file);
                return true;
            } else {
                return false;
            }
        }

        var more = this.getReferencedOrImportedFiles(this.projectFile.project.files)
            .filter(willNeedMoreAnalysis);
        while (more.length) {
            more = this.getReferencedOrImportedFiles(this.projectFile.project.files)
                .filter(willNeedMoreAnalysis);
        }
    }

    getReferencedOrImportedFiles = (files: string[]): string[]=> {
        var referenced: string[][] = [];

        files.forEach(file => {
            var preProcessedFileInfo = ts.preProcessFile(this.languageServiceHost.getScriptContent(file), true),
                dir = path.dirname(file);

            referenced.push(
                preProcessedFileInfo.referencedFiles.map(fileReference => utils.pathResolve(dir, fileReference.filename))
                    .concat(
                    preProcessedFileInfo.importedFiles
                        .filter((fileReference) => utils.pathIsRelative(fileReference.filename))
                        .map(fileReference => utils.pathResolve(dir, fileReference.filename + '.ts'))
                    )
                );
        });

        return utils.selectMany(referenced);
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

export interface EmitOutput {
    outputFiles: string[];
    success: boolean;
}

export interface TSError {
    filePath: string;
    startPos: languageServiceHost.Position;
    endPos: languageServiceHost.Position;
    message: string;
    preview: string;
}

export function getErrorsForFile(filePath: string): TSError[] {
    var program = getOrCreateProgram(filePath);
    var diagnostics = program.languageService.getSyntacticDiagnostics(filePath);
    if (diagnostics.length === 0) {
        diagnostics = program.languageService.getSemanticDiagnostics(filePath);
    }

    return diagnostics.map(diagnostic => ({
        filePath: diagnostic.file.filename,
        startPos: program.languageServiceHost.getPositionFromIndex(filePath, diagnostic.start),
        endPos: program.languageServiceHost.getPositionFromIndex(filePath, diagnostic.length + diagnostic.start),
        message: diagnostic.messageText,
        preview: program.languageServiceHost.getScriptContent(filePath).substr(diagnostic.start, diagnostic.length),
    }));
}
// Filtered means *only* for this file ... not because of file it references/imports
export function getErrorsForFileFiltered(filePath: string): TSError[] {
    // We have inconsistent Unix slashes. 
    // TODO: Make slashes consistent all around.
    var fileName = path.basename(filePath);
    return getErrorsForFile(filePath).filter((error) => path.basename(error.filePath) == fileName);
}