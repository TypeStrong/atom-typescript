///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

import fs = require('fs');
import path = require('path');
import os = require('os');
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
        var success = output.emitOutputStatus === ts.EmitReturnStatus.Succeeded;
        var errors: TSError[] = [];


        if (success) {
            // console.log('SUCCESS ' + filePath);
        }
        else {
            console.log('FAILURE ' + filePath + ' emit');
            var allDiagnostics = services.getCompilerOptionsDiagnostics()
                .concat(services.getSyntacticDiagnostics(filePath))
                .concat(services.getSemanticDiagnostics(filePath));

            allDiagnostics.forEach(diagnostic => {
                if (!diagnostic.file) return; // TODO: happens only for 'lib.d.ts' for now

                var startPosition = diagnostic.file.getLineAndCharacterFromPosition(diagnostic.start);
                console.log(diagnostic.file.filename, startPosition.line, startPosition.character, diagnostic.messageText);
                errors.push(diagnosticToTSError(diagnostic));
            });
        }

        output.outputFiles.forEach(o => {
            fs.writeFileSync(o.name, o.text, "utf8");
        });

        var outputFiles = output.outputFiles.map((o) => o.name);
        if (path.extname(filePath) == '.d.ts') {
            outputFiles.push(filePath);
        }

        return {
            outputFiles: outputFiles,
            success: success,
            errors: errors,
            emitError: !success && outputFiles.length === 0
        };
    }

    formatDocument(filePath: string): string {
        var textChanges = this.languageService.getFormattingEditsForDocument(filePath, defaultFormatCodeOptions());
        var formatted = this.formatCode(this.languageServiceHost.getScriptContent(filePath), textChanges);
        return formatted;
    }

    formatDocumentRange(filePath: string, start: languageServiceHost.Position, end: languageServiceHost.Position): string {
        var st = this.languageServiceHost.getIndexFromPosition(filePath, start);
        var ed = this.languageServiceHost.getIndexFromPosition(filePath, end);
        var textChanges = this.languageService.getFormattingEditsForRange(filePath, st, ed, defaultFormatCodeOptions());

        // Sadly ^ these changes are still relative to *start* of file. So lets fix that.
        textChanges.forEach((change) => change.span = new ts.TextSpan(change.span.start() - st, change.span.length()));

        var formatted = this.formatCode(this.languageServiceHost.getScriptContent(filePath).substring(st, ed), textChanges);
        return formatted;
    }

    // from https://github.com/Microsoft/TypeScript/issues/1651#issuecomment-69877863
    private formatCode(orig: string, changes: ts.TextChange[]): string {
        var result = orig;
        for (var i = changes.length - 1; i >= 0; i--) {
            var change = changes[i];
            var head = result.slice(0, change.span.start());
            var tail = result.slice(change.span.start() + change.span.length());
            result = head + change.newText + tail;
        }
        return result;
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
    var filePath = diagnostic.file.filename;
    var startPosition = diagnostic.file.getLineAndCharacterFromPosition(diagnostic.start);
    var endPosition = diagnostic.file.getLineAndCharacterFromPosition(diagnostic.start + diagnostic.length);
    return {
        filePath: filePath,
        // NOTE: the bases of indexes are different
        startPos: { line: startPosition.line - 1, ch: startPosition.character - 1 },
        endPos: { line: endPosition.line - 1, ch: endPosition.character - 1 },
        message: diagnostic.messageText,
        preview: diagnostic.file.text.substr(diagnostic.start, diagnostic.length),
    };
}

export function getErrorsForFile(filePath: string): TSError[] {
    var program = getOrCreateProgram(filePath);
    var diagnostics = program.languageService.getSyntacticDiagnostics(filePath);
    if (diagnostics.length === 0) {
        diagnostics = program.languageService.getSemanticDiagnostics(filePath);
    }

    return diagnostics.map(diagnosticToTSError);
}
// Filtered means *only* for this file ... not because of file it references/imports
export function getErrorsForFileFiltered(filePath: string): TSError[] {
    // We have inconsistent Unix slashes.
    // TODO: Make slashes consistent all around.
    var fileName = path.basename(filePath);
    return getErrorsForFile(filePath).filter((error) => path.basename(error.filePath) == fileName);
}

export function defaultFormatCodeOptions(): ts.FormatCodeOptions {
    return {
        IndentSize: 4,
        TabSize: 4,
        NewLineCharacter: os.EOL,
        ConvertTabsToSpaces: true,
        InsertSpaceAfterCommaDelimiter: true,
        InsertSpaceAfterSemicolonInForStatements: true,
        InsertSpaceBeforeAndAfterBinaryOperators: true,
        InsertSpaceAfterKeywordsInControlFlowStatements: true,
        InsertSpaceAfterFunctionKeywordForAnonymousFunctions: false,
        InsertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
        PlaceOpenBraceOnNewLineForFunctions: false,
        PlaceOpenBraceOnNewLineForControlBlocks: false,
    };
}
