///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

import fs = require('fs');
import mkdirp = require('mkdirp');
import path = require('path');
import os = require('os');
import ts = require('typescript');
var fuzzaldrin = require('fuzzaldrin');

import tsconfig = require('../tsconfig/tsconfig');
import languageServiceHost = require('./languageServiceHost');
import utils = require('./utils');

export class Program {
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
        var success = output.emitOutputStatus === ts.EmitReturnStatus.Succeeded;
        var errors: TSError[] = [];


        if (!success) {
            var allDiagnostics = services.getCompilerOptionsDiagnostics()
                .concat(services.getSyntacticDiagnostics(filePath))
                .concat(services.getSemanticDiagnostics(filePath));

            allDiagnostics.forEach(diagnostic => {
                if (!diagnostic.file) return; // TODO: happens only for 'lib.d.ts' for now

                var startPosition = diagnostic.file.getLineAndCharacterFromPosition(diagnostic.start);
                errors.push(diagnosticToTSError(diagnostic));
            });
        }

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
            success: success,
            errors: errors,
            emitError: !success && outputFiles.length === 0
        };
    }

    formatDocument(filePath: string, cursor: languageServiceHost.Position): { formatted: string; cursor: languageServiceHost.Position } {
        var textChanges = this.languageService.getFormattingEditsForDocument(filePath, defaultFormatCodeOptions());
        var formatted = this.formatCode(this.languageServiceHost.getScriptContent(filePath), textChanges);

        // Get new cursor based on new content
        var newCursor = this.formatCursor(this.languageServiceHost.getIndexFromPosition(filePath, cursor), textChanges);
        this.languageServiceHost.updateScript(filePath, formatted);

        return { formatted: formatted, cursor: this.languageServiceHost.getPositionFromIndex(filePath, newCursor) };
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

    private formatCursor(cursor: number, changes: ts.TextChange[]): number {
        // If cursor is inside a text change move it to the end of that text change
        var cursorInsideChange = changes.filter((change) => (change.span.start() < cursor) && ((change.span.end()) > cursor))[0];
        if (cursorInsideChange) {
            cursor = cursorInsideChange.span.end();
        }
        // Get all text changes that are *before* the cursor and determine the net *addition / subtraction* and apply that to the cursor.
        var beforeCursorChanges = changes.filter(change => change.span.start() < cursor);
        var netChange = 0;
        beforeCursorChanges.forEach(change => netChange = netChange - (change.span.length() - change.newText.length));

        return cursor + netChange;
    }
}

var programByProjectPath: { [projectDir: string]: Program } = {}
var programByFilePath: { [filePath: string]: Program } = {}

function getOrCreateProject(filePath): tsconfig.TypeScriptProjectFileDetails {
    try {
        var project = tsconfig.getProjectSync(filePath);
        return project;
    } catch (ex) {
        var err: Error = ex;
        if (err.message === tsconfig.errors.GET_PROJECT_INVALID_PROJECT_FILE) {
            throw ex;
        }
        else {
            return tsconfig.createProjectRootSync(filePath);
        }
    }
}

export function getOrCreateProgram(filePath) {
    filePath = tsconfig.consistentPath(filePath);
    if (programByFilePath[filePath]) {
        return programByFilePath[filePath];
    }
    else {
        var projectFile = getOrCreateProject(filePath);
        if (programByProjectPath[projectFile.projectFileDirectory]) {
            // we've already parsed the project file once before. This file wasn't in there for some reason
            // we just need to update for this file
            return programByFilePath[filePath] = programByProjectPath[projectFile.projectFileDirectory];
        } else {
            var program = programByProjectPath[projectFile.projectFileDirectory] = new Program(projectFile);
            projectFile.project.files.forEach((file) => programByFilePath[file] = program);
            return program;
        }
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

export interface Completion {
    name: string; // stuff like "toString"
    kind: string; // stuff like "var"
    comment: string; // the docComment if any
    display: string; // This is either displayParts (for functions) or just the kind duplicated
}

////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// QUERY / RESPONSE //////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

/** utility interface **/
interface FilePathQuery{
    filePath:string;
}

export interface Echo {
    echo: any;
}
export function echo(data: Echo): Echo {
    return data;
}

export interface QuickInfoQuery extends FilePathQuery{
    position: number;
}
export interface QuickInfoResponse {
    valid: boolean; // Do we have a valid response for this query
    name?: string;
    comment?: string;
}
export function quickInfo(query: QuickInfoQuery): QuickInfoResponse {
    var program = getOrCreateProgram(query.filePath);
    var info = program.languageService.getQuickInfoAtPosition(query.filePath, query.position);
    if (!info) return { valid: false };
    else return {
        valid: true,
        name: ts.displayPartsToString(info.displayParts || []),
        comment: ts.displayPartsToString(info.documentation || []),
    }
}

export interface BuildQuery extends FilePathQuery{}
export interface BuildResponse {
    outputs: BuildOutput;
}
export function build(query: BuildQuery): BuildResponse {
    return {
        outputs: getOrCreateProgram(query.filePath).build()
    };
}

/** Filtered means *only* for this file i.e. exclude errors from files it references/imports */
export interface ErrorsForFileFilteredQuery extends FilePathQuery {}
export interface ErrorsForFileFilteredResponse {
    errors: TSError[];
}
export function errorsForFileFiltered(query: ErrorsForFileFilteredQuery): ErrorsForFileFilteredResponse {
    // We have inconsistent Unix slashes.
    // TODO: Make slashes consistent all around. Something in language service is funny
    var fileName = path.basename(query.filePath);
    return { errors: getErrorsForFile(query.filePath).filter((error) => path.basename(error.filePath) == fileName) };
}

export interface GetCompletionsAtPositionQuery extends FilePathQuery {
    position: number;
    prefix: string;
}
export interface GetCompletionsAtPositionResponse {
    completions: Completion[];
}
/** gets the first 10 completions only */
export function getCompletionsAtPosition(query:GetCompletionsAtPositionQuery): GetCompletionsAtPositionResponse {
    var filePath = query.filePath, position = query.position, prefix = query.prefix;

    var program = getOrCreateProgram(filePath);
    var completions: ts.CompletionInfo = program.languageService.getCompletionsAtPosition(
        filePath, position);
    var completionList = completions ? completions.entries.filter(x=> !!x) : [];

    if (prefix.length && prefix !== '.') {
        completionList = fuzzaldrin.filter(completionList, prefix, { key: 'name' });
    }

    // limit to 10
    if (completionList.length > 10) completionList = completionList.slice(0, 10);

    // Potentially use it more aggresively at some point
    function docComment(c: ts.CompletionEntry): { display: string; comment: string; } {
        var completionDetails = program.languageService.getCompletionEntryDetails(filePath, position, c.name);

        // Show the signatures for methods / functions
        if (c.kind == "method" || c.kind == "function") {
            var display = ts.displayPartsToString(completionDetails.displayParts || []);
        } else {
            var display = c.kind;
        }
        var comment = ts.displayPartsToString(completionDetails.documentation || []);

        return { display: display, comment: comment };
    }

    return {
        completions: completionList.map(c=> {
            var details = docComment(c);
            return {
                name: c.name,
                kind: c.kind,
                comment: details.comment,
                display: details.display
            };
        })
    };
}

export interface EmitFileQuery extends FilePathQuery{}
export interface EmitFileResponse extends EmitOutput{}
export function emitFile(query:EmitFileQuery): EmitFileResponse{
    return getOrCreateProgram(query.filePath).emitFile(query.filePath);
}

export interface FormatDocumentQuery extends FilePathQuery{
    cursor: languageServiceHost.Position
}
export interface FormatDocumentResponse{
    formatted:string;
    cursor:languageServiceHost.Position
}
export function formatDocument(query: FormatDocumentQuery): FormatDocumentResponse {
    var prog = getOrCreateProgram(query.filePath);
    return prog.formatDocument(query.filePath, query.cursor);
}

export interface FormatDocumentRangeQuery extends FilePathQuery{
    start: languageServiceHost.Position;
    end: languageServiceHost.Position;
}
export interface FormatDocumentRangeResponse{   formatted:string;}
export function formatDocumentRange(query: FormatDocumentRangeQuery): FormatDocumentRangeResponse {
    var prog = getOrCreateProgram(query.filePath);
    return {formatted:prog.formatDocumentRange(query.filePath,query.start,query.end)};
}

export interface GetDefinitionsAtPositionQuery extends FilePathQuery{
    position: number;
}
export interface GetDefinitionsAtPositionResponse{
    definitions:{
        filePath: string;
        position: languageServiceHost.Position
    }[]
}
export function getDefinitionsAtPosition(query:GetDefinitionsAtPositionQuery): GetDefinitionsAtPositionResponse{
    var program = getOrCreateProgram(query.filePath);
    var definitions = program.languageService.getDefinitionAtPosition(query.filePath, query.position);
    if (!definitions || !definitions.length) return {definitions:[]};

    return {definitions:definitions.map(d=>{
        // If we can get the filename *we are in the same program :P*
        var pos = program.languageServiceHost.getPositionFromIndex(d.fileName, d.textSpan.start());
            return {
                    filePath: d.fileName,
                    position: pos
            };
        })
        };
}
