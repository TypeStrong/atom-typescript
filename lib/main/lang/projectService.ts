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
/** the project file path or any source ts file path */
var projectByFilePath: { [filePath: string]: Project } = {}

/** Warning: we are loading the project from file system. This might not match what we have in the editor memory
 This is the reason why we aggresively send text to the worker on *Tab Change* and other places
*/
function cacheAndCreateProject(projectFile: tsconfig.TypeScriptProjectFileDetails) {
    var project = projectByProjectPath[projectFile.projectFileDirectory] = new Project(projectFile);
    projectFile.project.files.forEach((file) => projectByFilePath[file] = project);
    return project;
}

/**
 * This explicilty loads the project from the filesystem or creates one
 * creation is done in memory (for .d.ts) OR filesytem
 */
function getOrCreateProjectFile(filePath): tsconfig.TypeScriptProjectFileDetails {
    try {
        var projectFile = tsconfig.getProjectSync(filePath);
        return projectFile;
    } catch (ex) {
        var err: Error = ex;
        if (err.message === tsconfig.errors.GET_PROJECT_NO_PROJECT_FOUND) {
            var projectFile = tsconfig.createProjectRootSync(filePath);
            return projectFile;
        }
        else {
            throw ex;
        }
    }
}

function getOrCreateProject(filePath: string) {
    filePath = tsconfig.consistentPath(filePath);
    if (projectByFilePath[filePath]) {
        // we are in good shape
        return projectByFilePath[filePath];
    }
    else {
        // We are in a bad shape. Why didn't we know of this file before?
        // Even if we find the projectFile we should invalidate it.
        var projectFile = getOrCreateProjectFile(filePath);
        var project = cacheAndCreateProject(projectFile);
        return project;
    }
}

//--------------------------------------------------------------------------
//  Utility Interfaces
//--------------------------------------------------------------------------

/** utility interface **/
interface FilePathQuery {
    filePath: string;
}

/** utility interface **/
interface FilePathPositionQuery {
    filePath: string;
    position: number;
}

interface TextSpan {
    start: number;
    length: number;
}
function textSpan(span: ts.TextSpan): TextSpan {
    return {
        start: span.start(),
        length: span.length()
    }
}

////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// QUERY / RESPONSE //////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

export interface Echo {
    echo: any;
}
export function echo(data: Echo): Echo {
    return data;
}

export interface QuickInfoQuery extends FilePathPositionQuery { }
export interface QuickInfoResponse {
    valid: boolean; // Do we have a valid response for this query
    name?: string;
    comment?: string;
}
export function quickInfo(query: QuickInfoQuery): QuickInfoResponse {
    var project = getOrCreateProject(query.filePath);
    var info = project.languageService.getQuickInfoAtPosition(query.filePath, query.position);
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

export interface GetCompletionsAtPositionQuery extends FilePathPositionQuery {
    prefix: string;
    maxSuggestions: number;
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

    var project = getOrCreateProject(filePath);
    var completions: ts.CompletionInfo = project.languageService.getCompletionsAtPosition(
        filePath, position);
    var completionList = completions ? completions.entries.filter(x=> !!x) : [];
    var endsInPunctuation = prefix.length && prefix.trim().length && punctuations[prefix.trim()[prefix.trim().length - 1]]

    if (prefix.length && !endsInPunctuation) {
        // Didn't work good for punctuation
        completionList = fuzzaldrin.filter(completionList, prefix, { key: 'name' });
    }

    // limit to maxSuggestions
    if (completionList.length > query.maxSuggestions) completionList = completionList.slice(0, query.maxSuggestions);

    // Potentially use it more aggresively at some point
    function docComment(c: ts.CompletionEntry): { display: string; comment: string; } {
        var completionDetails = project.languageService.getCompletionEntryDetails(filePath, position, c.name);

        // Show the signatures for methods / functions
        var display: string;
        if (c.kind == "method" || c.kind == "function") {
            display = ts.displayPartsToString(completionDetails.displayParts || []);
        }
        else if (c.kind == "property") {
            display = ts.displayPartsToString(completionDetails.displayParts || []);
        }
        else {
            display = c.kind;
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

export interface GetSignatureHelpQuery extends FilePathPositionQuery { }
export interface SignatureHelp {

}
export interface GetSignatureHelpResponse {
    signatureHelps: SignatureHelp[];
}
export function getSignatureHelps(query: GetSignatureHelpQuery): GetSignatureHelpResponse {
    var project = getOrCreateProject(query.filePath);
    var signatureHelpItems = project.languageService.getSignatureHelpItems(query.filePath, query.position);

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

export interface RegenerateProjectGlobQuery extends FilePathQuery { }
export interface RegenerateProjectGlobResponse { }
export function regenerateProjectGlob(query: RegenerateProjectGlobQuery): RegenerateProjectGlobResponse {
    var projectFile = getOrCreateProjectFile(query.filePath);
    cacheAndCreateProject(projectFile);
    return {};
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

export interface GetDefinitionsAtPositionQuery extends FilePathPositionQuery { }
export interface GetDefinitionsAtPositionResponse {
    projectFileDirectory: string;
    definitions: {
        filePath: string;
        position: languageServiceHost.Position
    }[]
}
export function getDefinitionsAtPosition(query: GetDefinitionsAtPositionQuery): GetDefinitionsAtPositionResponse {
    var project = getOrCreateProject(query.filePath);
    var definitions = project.languageService.getDefinitionAtPosition(query.filePath, query.position);
    var projectFileDirectory = project.projectFile.projectFileDirectory;
    if (!definitions || !definitions.length) return { projectFileDirectory: projectFileDirectory, definitions: [] };

    return {
        projectFileDirectory: projectFileDirectory,
        definitions: definitions.map(d=> {
            // If we can get the filename *we are in the same program :P*
            var pos = project.languageServiceHost.getPositionFromIndex(d.fileName, d.textSpan.start());
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

export interface GetRenameInfoQuery extends FilePathPositionQuery { }
export interface GetRenameInfoResponse {
    canRename: boolean;
    localizedErrorMessage?: string;
    displayName?: string;
    fullDisplayName?: string; // this includes the namespace name
    kind?: string;
    kindModifiers?: string;
    triggerSpan?: TextSpan;
    locations?: {
        textSpan: TextSpan;
        filePath: string;
    }[];
}
export function getRenameInfo(query: GetRenameInfoQuery): GetRenameInfoResponse {
    var project = getOrCreateProject(query.filePath);
    var findInStrings = false, findInComments = false;
    var info = project.languageService.getRenameInfo(query.filePath, query.position);
    if (info && info.canRename) {
        var locations = project.languageService.findRenameLocations(query.filePath, query.position, findInStrings, findInComments)
            .map(loc=> {
            return {
                textSpan: textSpan(loc.textSpan),
                filePath: loc.fileName
            }
        });
        return {
            canRename: true,
            localizedErrorMessage: info.localizedErrorMessage,
            displayName: info.displayName,
            fullDisplayName: info.fullDisplayName,
            kind: info.kind,
            kindModifiers: info.kindModifiers,
            triggerSpan: textSpan(info.triggerSpan),
            locations: locations
        }
    }
    else {
        return {
            canRename: false
        }
    }
}
