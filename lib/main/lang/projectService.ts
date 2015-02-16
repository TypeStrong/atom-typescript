///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

import fs = require('fs');
import path = require('path');
import os = require('os');
import ts = require('typescript');
var fuzzaldrin = require('fuzzaldrin');

import tsconfig = require('../tsconfig/tsconfig');

import utils = require('./utils');
import project = require('./project');
import Project = project.Project;
import languageServiceHost = require('./languageServiceHost');

////////////////////////////////////////////////////////////////////////////////////////
//////////////// MAINTAIN A HOT CACHE TO DECREASE FILE LOOKUPS /////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

var projectByProjectPath: { [projectDir: string]: Project } = {}
var projectByFilePath: { [filePath: string]: Project } = {}

function getOrCreateProjectFile(filePath): tsconfig.TypeScriptProjectFileDetails {
    try {
        var projectFile = tsconfig.getProjectSync(filePath);
        return projectFile;
    } catch (ex) {
        var err: Error = ex;
        if (err.message === tsconfig.errors.GET_PROJECT_NO_PROJECT_FOUND) {
            return tsconfig.createProjectRootSync(filePath);
        }
        else {
            throw ex;
        }
    }
}

function getOrCreateProject(filePath) {
    filePath = tsconfig.consistentPath(filePath);
    if (projectByFilePath[filePath]) {
        return projectByFilePath[filePath];
    }
    else {
        var projectFile = getOrCreateProjectFile(filePath);
        if (projectByProjectPath[projectFile.projectFileDirectory]) {
            // we've already parsed the project file once before. This file wasn't in there for some reason
            // we just need to update for this file
            return projectByFilePath[filePath] = projectByProjectPath[projectFile.projectFileDirectory];
        } else {
            var program = projectByProjectPath[projectFile.projectFileDirectory] = new Project(projectFile);
            projectFile.project.files.forEach((file) => projectByFilePath[file] = program);
            return program;
        }
    }
}

////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// QUERY / RESPONSE //////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

/** utility interface **/
interface FilePathQuery {
    filePath: string;
}

export interface Echo {
    echo: any;
}
export function echo(data: Echo): Echo {
    return data;
}

export interface QuickInfoQuery extends FilePathQuery {
    position: number;
}
export interface QuickInfoResponse {
    valid: boolean; // Do we have a valid response for this query
    name?: string;
    comment?: string;
}
export function quickInfo(query: QuickInfoQuery): QuickInfoResponse {
    var program = getOrCreateProject(query.filePath);
    var info = program.languageService.getQuickInfoAtPosition(query.filePath, query.position);
    if (!info) return { valid: false };
    else return {
        valid: true,
        name: ts.displayPartsToString(info.displayParts || []),
        comment: ts.displayPartsToString(info.documentation || []),
    }
}

export interface BuildQuery extends FilePathQuery { }
export interface BuildResponse {
    outputs: project.BuildOutput;
}
export function build(query: BuildQuery): BuildResponse {
    return {
        outputs: getOrCreateProject(query.filePath).build()
    };
}

/** Filtered means *only* for this file i.e. exclude errors from files it references/imports */
export interface ErrorsForFileFilteredQuery extends FilePathQuery { }
export interface ErrorsForFileFilteredResponse {
    errors: project.TSError[];
}
export function errorsForFileFiltered(query: ErrorsForFileFilteredQuery): ErrorsForFileFilteredResponse {
    // We have inconsistent Unix slashes.
    // TODO: Make slashes consistent all around. Something in language service is funny
    var fileName = path.basename(query.filePath);
    return { errors: errorsForFile({ filePath: query.filePath }).errors.filter((error) => path.basename(error.filePath) == fileName) };
}

export interface GetCompletionsAtPositionQuery extends FilePathQuery {
    position: number;
    prefix: string;
}
export interface Completion {
    name: string; // stuff like "toString"
    kind: string; // stuff like "var"
    comment: string; // the docComment if any
    display: string; // This is either displayParts (for functions) or just the kind duplicated
}
export interface GetCompletionsAtPositionResponse {
    completions: Completion[];
    endsInPunctuation: boolean;
}
var punctuations = utils.createMap([';', '{', '}', '(', ')', '.', ':', '<', '>']);
/** gets the first 10 completions only */
export function getCompletionsAtPosition(query: GetCompletionsAtPositionQuery): GetCompletionsAtPositionResponse {
    var filePath = query.filePath, position = query.position, prefix = query.prefix;

    var program = getOrCreateProject(filePath);
    var completions: ts.CompletionInfo = program.languageService.getCompletionsAtPosition(
        filePath, position);
    var completionList = completions ? completions.entries.filter(x=> !!x) : [];
    var endsInPunctuation = prefix.length && prefix.trim().length && punctuations[prefix.trim()[prefix.trim().length - 1]]

    if (prefix.length && !endsInPunctuation) {
        // Didn't work good for punctuation
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
        }),
        endsInPunctuation: endsInPunctuation
    };
}

export interface GetSignatureHelpQuery extends FilePathQuery {
    position: number;
}
export interface SignatureHelp {

}
export interface GetSignatureHelpResponse {
    signatureHelps: SignatureHelp[];
}
export function getSignatureHelps(query: GetSignatureHelpQuery): GetSignatureHelpResponse {
    var program = getOrCreateProject(query.filePath);
    var signatureHelpItems = program.languageService.getSignatureHelpItems(query.filePath, query.position);

    if (!signatureHelpItems || !signatureHelpItems.items || !signatureHelpItems.items.length)
        return { signatureHelps: [] };

    // TODO: WIP
    return <any>signatureHelpItems.items;
}

export interface EmitFileQuery extends FilePathQuery { }
export interface EmitFileResponse extends project.EmitOutput { }
export function emitFile(query: EmitFileQuery): EmitFileResponse {
    return getOrCreateProject(query.filePath).emitFile(query.filePath);
}

export interface FormatDocumentQuery extends FilePathQuery {
    cursor: languageServiceHost.Position
}
export interface FormatDocumentResponse {
    formatted: string;
    cursor: languageServiceHost.Position
}
export function formatDocument(query: FormatDocumentQuery): FormatDocumentResponse {
    var prog = getOrCreateProject(query.filePath);
    return prog.formatDocument(query.filePath, query.cursor);
}

export interface FormatDocumentRangeQuery extends FilePathQuery {
    start: languageServiceHost.Position;
    end: languageServiceHost.Position;
}
export interface FormatDocumentRangeResponse { formatted: string; }
export function formatDocumentRange(query: FormatDocumentRangeQuery): FormatDocumentRangeResponse {
    var prog = getOrCreateProject(query.filePath);
    return { formatted: prog.formatDocumentRange(query.filePath, query.start, query.end) };
}

export interface GetDefinitionsAtPositionQuery extends FilePathQuery {
    position: number;
}
export interface GetDefinitionsAtPositionResponse {
    definitions: {
        filePath: string;
        position: languageServiceHost.Position
    }[]
}
export function getDefinitionsAtPosition(query: GetDefinitionsAtPositionQuery): GetDefinitionsAtPositionResponse {
    var program = getOrCreateProject(query.filePath);
    var definitions = program.languageService.getDefinitionAtPosition(query.filePath, query.position);
    if (!definitions || !definitions.length) return { definitions: [] };

    return {
        definitions: definitions.map(d=> {
            // If we can get the filename *we are in the same program :P*
            var pos = program.languageServiceHost.getPositionFromIndex(d.fileName, d.textSpan.start());
            return {
                filePath: d.fileName,
                position: pos
            };
        })
    };
}

export interface UpdateTextQuery extends FilePathQuery {
    text: string;
}
export function updateText(query: UpdateTextQuery): any {
    getOrCreateProject(query.filePath).languageServiceHost.updateScript(query.filePath, query.text);
    return {};
}

export function errorsForFile(query: FilePathQuery): {
    errors: project.TSError[]
} {
    var program = getOrCreateProject(query.filePath);
    var diagnostics = program.languageService.getSyntacticDiagnostics(query.filePath);
    if (diagnostics.length === 0) {
        diagnostics = program.languageService.getSemanticDiagnostics(query.filePath);
    }

    return { errors: diagnostics.map(project.diagnosticToTSError) };
}
