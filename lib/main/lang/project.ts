///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

import ts = require('typescript');
import path = require('path');
import mkdirp = require('mkdirp');
import fs = require('fs');
import os = require('os');

export import languageServiceHost = require('./languageServiceHost2');
import tsconfig = require('../tsconfig/tsconfig');
import utils = require('./utils');

export class Project {
    public languageServiceHost: languageServiceHost.LanguageServiceHost;
    public languageService: ts.LanguageService;

    constructor(public projectFile: tsconfig.TypeScriptProjectFileDetails) {
        this.languageServiceHost = new languageServiceHost.LanguageServiceHost(projectFile);
        this.languageService = ts.createLanguageService(this.languageServiceHost, ts.createDocumentRegistry());
    }

    public build(): BuildOutput {
        var outputs = this.projectFile.project.files.map((filename) => {
            return this.emitFile(filename);
        });

        return {
            outputs: outputs,
            counts: {
                inputFiles: this.projectFile.project.files.length,
                outputFiles: utils.selectMany(outputs.map((out) => out.outputFiles)).length,
                errors: utils.selectMany(outputs.map((out) => out.errors)).length,
                emitErrors: outputs.filter(out => out.emitError).length
            }
        };
    }

    emitFile = (filePath: string): EmitOutput => {
        var services = this.languageService;
        var output = services.getEmitOutput(filePath);
        var emitDone = !output.emitSkipped;
        var errors: TSError[] = [];

        // Emit is no guarantee that there are no errors
        var allDiagnostics = services.getCompilerOptionsDiagnostics()
            .concat(services.getSyntacticDiagnostics(filePath))
            .concat(services.getSemanticDiagnostics(filePath));

        allDiagnostics.forEach(diagnostic => {
            // happens only for 'lib.d.ts' for some reason
            if (!diagnostic.file) return;

            var startPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
            errors.push(diagnosticToTSError(diagnostic));
        });

        output.outputFiles.forEach(o => {
            mkdirp.sync(path.dirname(o.name));
            fs.writeFileSync(o.name, o.text, "utf8");
        });

        var outputFiles = output.outputFiles.map((o) => o.name);
        if (path.extname(filePath) == '.d.ts') {
            outputFiles.push(filePath);
        }

        return {
            outputFiles: outputFiles,
            success: emitDone && !errors.length,
            errors: errors,
            emitError: !emitDone
        };
    }
}

// TODO: move these interfaces *and* the associated functions out of "project" (and this file)
export interface BuildOutput {
    outputs: EmitOutput[];
    counts: {
        inputFiles: number;
        outputFiles: number;
        errors: number;
        emitErrors: number;
    }
}
export interface EmitOutput {
    outputFiles: string[];
    success: boolean;
    errors: TSError[];
    emitError: boolean;
}
export interface TSError {
    filePath: string;
    startPos: languageServiceHost.Position;
    endPos: languageServiceHost.Position;
    message: string;
    preview: string;
}

export function diagnosticToTSError(diagnostic: ts.Diagnostic): TSError {
    var filePath = diagnostic.file.fileName;
    var startPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    var endPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start + diagnostic.length);

    return {
        filePath: filePath,
        startPos: { line: startPosition.line, col: startPosition.character },
        endPos: { line: endPosition.line, col: endPosition.character },
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        preview: diagnostic.file.text.substr(diagnostic.start, diagnostic.length),
    };
}
