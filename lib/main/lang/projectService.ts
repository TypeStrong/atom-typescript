///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

import fs = require('fs');
import path = require('path');
import os = require('os');
import ts = require('typescript');
var fuzzaldrin: { filter: (list: any[], prefix: string, property?: { key: string }) => any } = require('fuzzaldrin');

import tsconfig = require('../tsconfig/tsconfig');

import utils = require('./utils');
import project = require('./project');
import Project = project.Project;
import languageServiceHost = require('./languageServiceHost');

var resolve: typeof Promise.resolve = Promise.resolve.bind(Promise);

////////////////////////////////////////////////////////////////////////////////////////
//////////////// MECHANISM FOR THE CHILD TO QUERY THE PARENT ///////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

import workerLib = require('../../worker/lib/workerLib');
import queryParent = require('../../worker/queryParent');

// pushed in by child.ts
// If we are in a child context we patch the functions to execute via IPC.
// Otherwise we would call them directly.
var child: workerLib.Child;
export function fixChild(childInjected: typeof child) {
    child = childInjected;
    queryParent.echoNumWithModification = child.sendToIpc(queryParent.echoNumWithModification);
    queryParent.getUpdatedTextForUnsavedEditors = child.sendToIpc(queryParent.getUpdatedTextForUnsavedEditors);
    queryParent.setConfigurationError = child.sendToIpc(queryParent.setConfigurationError);
}

////////////////////////////////////////////////////////////////////////////////////////
//////////////// MAINTAIN A HOT CACHE TO DECREASE FILE LOOKUPS /////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

var projectByProjectFilePath: { [projectFilePath: string]: Project } = {}
/** the project file path or any source ts file path */
var projectByFilePath: { [filePath: string]: Project } = {}


var watchingProjectFile: { [projectFilePath: string]: boolean } = {}
function watchProjectFileIfNotDoingItAlready(projectFilePath: string) {

    // Don't watch lib.d.ts and other
    // projects that are "in memory" only
    if (!fs.existsSync(projectFilePath)) {
        return;
    }

    if (watchingProjectFile[projectFilePath]) return; // Only watch once
    watchingProjectFile[projectFilePath] = true;

    fs.watch(projectFilePath, { persistent: false, recursive: false }, () => {
        // if file no longer exists
        if (!fs.existsSync(projectFilePath)) {
            // if we have a cache for it then clear it
            var project = projectByProjectFilePath[projectFilePath];
            if (project) {
                var files = project.projectFile.project.files;

                delete projectByProjectFilePath[projectFilePath];
                files.forEach((file) => delete projectByFilePath[file]);
            }
            return;
        }

        // Reload the project file from the file system and re cache it
        try {
            var projectFile = getOrCreateProjectFile(projectFilePath);
            cacheAndCreateProject(projectFile);
            queryParent.setConfigurationError({ projectFilePath: projectFile.projectFilePath, error: null });
        }
        catch (ex) {
            // Keep failing silently
            // TODO: reuse reporting logic
        }
    });
}

/** We are loading the project from file system.
    This might not match what we have in the editor memory, so query those as well
*/
function cacheAndCreateProject(projectFile: tsconfig.TypeScriptProjectFileDetails) {
    var project = projectByProjectFilePath[projectFile.projectFilePath] = new Project(projectFile);
    projectFile.project.files.forEach((file) => projectByFilePath[file] = project);

    // query the parent for unsaved changes
    // We do this lazily
    queryParent.getUpdatedTextForUnsavedEditors({})
        .then(resp=> {
        resp.editors.forEach(e=> {
            project.languageServiceHost.updateScript(e.filePath, e.text);
        });
    });

    watchProjectFileIfNotDoingItAlready(projectFile.projectFilePath);

    return project;
}

/**
 * This explicilty loads the project from the filesystem or creates one
 * creation is done in memory (for .d.ts) OR filesytem
 */
function getOrCreateProjectFile(filePath: string): tsconfig.TypeScriptProjectFileDetails {
    try {
        // If we are asked to look at stuff in lib.d.ts create its own project
        if (path.dirname(filePath) == path.dirname(languageServiceHost.defaultLibFile)) {
            return tsconfig.getDefaultProject(filePath);
        }

        var projectFile = tsconfig.getProjectSync(filePath);
        queryParent.setConfigurationError({ projectFilePath: projectFile.projectFilePath, error: null });
        return projectFile;
    } catch (ex) {
        var err: Error = ex;
        if (err.message === tsconfig.errors.GET_PROJECT_NO_PROJECT_FOUND) {
            // If we have a .d.ts file then it is its own project and return
            if (tsconfig.endsWith(filePath.toLowerCase(), '.d.ts')) {
                return tsconfig.getDefaultProject(filePath);
            }
            // Otherwise create one on disk
            else {
                var projectFile = tsconfig.createProjectRootSync(filePath);
                queryParent.setConfigurationError({ projectFilePath: projectFile.projectFilePath, error: null });
                return projectFile;
            }
        }
        else {
            if (ex.message === tsconfig.errors.GET_PROJECT_JSON_PARSE_FAILED) {
                let details: tsconfig.GET_PROJECT_JSON_PARSE_FAILED_Details = ex.details;
                queryParent.setConfigurationError({
                    projectFilePath: details.projectFilePath,
                    error: {
                        message: ex.message,
                        details: ex.details
                    }
                });
                // Watch this project file to see if user fixes errors
                watchProjectFileIfNotDoingItAlready(details.projectFilePath);
            }
            if (ex.message === tsconfig.errors.GET_PROJECT_PROJECT_FILE_INVALID_OPTIONS) {
                let details: tsconfig.GET_PROJECT_PROJECT_FILE_INVALID_OPTIONS_Details = ex.details;
                queryParent.setConfigurationError({
                    projectFilePath: details.projectFilePath,
                    error: {
                        message: ex.message,
                        details: ex.details
                    }
                });
                // Watch this project file to see if user fixes errors
                watchProjectFileIfNotDoingItAlready(details.projectFilePath);
            }
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
        start: span.start,
        length: span.length
    }
}

/** mutate and fix the filePath silently */
function consistentPath(query: FilePathQuery) {
    if (!query.filePath) return;
    query.filePath = tsconfig.consistentPath(query.filePath);
}

////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// QUERY / RESPONSE //////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

export interface Echo {
    echo: any;
    num: number;
}
export function echo(data: Echo): Promise<Echo> {
    return queryParent.echoNumWithModification({ num: data.num }).then((resp) => {
        data.num = resp.num;
        return data;
    });
}

export interface QuickInfoQuery extends FilePathPositionQuery { }
export interface QuickInfoResponse {
    valid: boolean; // Do we have a valid response for this query
    name?: string;
    comment?: string;
}
export function quickInfo(query: QuickInfoQuery): Promise<QuickInfoResponse> {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var info = project.languageService.getQuickInfoAtPosition(query.filePath, query.position);
    if (!info) return Promise.resolve({ valid: false });
    else return resolve({
        valid: true,
        name: ts.displayPartsToString(info.displayParts || []),
        comment: ts.displayPartsToString(info.documentation || []),
    });
}

export interface BuildQuery extends FilePathQuery { }
export interface BuildResponse {
    outputs: project.BuildOutput;
}
export function build(query: BuildQuery): Promise<BuildResponse> {
    consistentPath(query);
    return resolve({
        outputs: getOrCreateProject(query.filePath).build()
    });
}

/** Filtered means *only* for this file i.e. exclude errors from files it references/imports */
export interface ErrorsForFileFilteredQuery extends FilePathQuery { }
export interface ErrorsForFileFilteredResponse {
    errors: project.TSError[];
}
export function errorsForFileFiltered(query: ErrorsForFileFilteredQuery): Promise<ErrorsForFileFilteredResponse> {
    consistentPath(query);
    var fileName = path.basename(query.filePath);

    return errorsForFile({ filePath: query.filePath })
        .then((resp) =>
        <ErrorsForFileFilteredResponse>{ errors: resp.errors.filter((error) => path.basename(error.filePath) == fileName) });
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
var punctuations = utils.createMap([';', '{', '}', '(', ')', '.', ':', '<', '>', "'", '"']);
var prefixEndsInPunctuation = (prefix) => prefix.length && prefix.trim().length && punctuations[prefix.trim()[prefix.trim().length - 1]];
/** gets the first 10 completions only */
export function getCompletionsAtPosition(query: GetCompletionsAtPositionQuery): Promise<GetCompletionsAtPositionResponse> {
    consistentPath(query);
    var filePath = query.filePath, position = query.position, prefix = query.prefix;

    var project = getOrCreateProject(filePath);
    var completions: ts.CompletionInfo = project.languageService.getCompletionsAtPosition(
        filePath, position);
    var completionList = completions ? completions.entries.filter(x=> !!x) : [];
    var endsInPunctuation = prefixEndsInPunctuation(prefix);

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

    return resolve({
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
    });
}

export interface GetSignatureHelpQuery extends FilePathPositionQuery { }
export interface SignatureHelp {

}
export interface GetSignatureHelpResponse {
    signatureHelps: SignatureHelp[];
}
export function getSignatureHelps(query: GetSignatureHelpQuery): Promise<GetSignatureHelpResponse> {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var signatureHelpItems = project.languageService.getSignatureHelpItems(query.filePath, query.position);

    if (!signatureHelpItems || !signatureHelpItems.items || !signatureHelpItems.items.length)
        return resolve({ signatureHelps: [] });

    // TODO: WIP
    return <any>signatureHelpItems.items;
}

export interface EmitFileQuery extends FilePathQuery { }
export interface EmitFileResponse extends project.EmitOutput { }
export function emitFile(query: EmitFileQuery): Promise<EmitFileResponse> {
    consistentPath(query);
    return resolve(getOrCreateProject(query.filePath).emitFile(query.filePath));
}

export interface FormatDocumentQuery extends FilePathQuery {
    cursor: languageServiceHost.Position
}
export interface FormatDocumentResponse {
    formatted: string;
    cursor: languageServiceHost.Position
}
export function formatDocument(query: FormatDocumentQuery): Promise<FormatDocumentResponse> {
    consistentPath(query);
    var prog = getOrCreateProject(query.filePath);
    return resolve(prog.formatDocument(query.filePath, query.cursor));
}

export interface FormatDocumentRangeQuery extends FilePathQuery {
    start: languageServiceHost.Position;
    end: languageServiceHost.Position;
}
export interface FormatDocumentRangeResponse { formatted: string; }
export function formatDocumentRange(query: FormatDocumentRangeQuery): Promise<FormatDocumentRangeResponse> {
    consistentPath(query);
    var prog = getOrCreateProject(query.filePath);
    return resolve({ formatted: prog.formatDocumentRange(query.filePath, query.start, query.end) });
}

export interface GetDefinitionsAtPositionQuery extends FilePathPositionQuery { }
export interface GetDefinitionsAtPositionResponse {
    projectFileDirectory: string;
    definitions: {
        filePath: string;
        position: languageServiceHost.Position
    }[]
}
export function getDefinitionsAtPosition(query: GetDefinitionsAtPositionQuery): Promise<GetDefinitionsAtPositionResponse> {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var definitions = project.languageService.getDefinitionAtPosition(query.filePath, query.position);
    var projectFileDirectory = project.projectFile.projectFileDirectory;
    if (!definitions || !definitions.length) return resolve({ projectFileDirectory: projectFileDirectory, definitions: [] });

    return resolve({
        projectFileDirectory: projectFileDirectory,
        definitions: definitions.map(d=> {
            // If we can get the filename *we are in the same program :P*
            var pos = project.languageServiceHost.getPositionFromIndex(d.fileName, d.textSpan.start);
            return {
                filePath: d.fileName,
                position: pos
            };
        })
    });
}

export interface UpdateTextQuery extends FilePathQuery {
    text: string;
}
export function updateText(query: UpdateTextQuery): Promise<any> {
    consistentPath(query);
    getOrCreateProject(query.filePath).languageServiceHost.updateScript(query.filePath, query.text);
    return resolve({});
}

export interface EditTextQuery extends FilePathQuery {
    minChar: number;
    limChar: number;
    newText: string;
}
export function editText(query: EditTextQuery): Promise<any> {
    consistentPath(query);
    getOrCreateProject(query.filePath).languageServiceHost.editScript(query.filePath, query.minChar, query.limChar, query.newText);
    return resolve({});
}

export function errorsForFile(query: FilePathQuery): Promise<{
    errors: project.TSError[]
}> {
    consistentPath(query);
    var program = getOrCreateProject(query.filePath);
    var diagnostics = program.languageService.getSyntacticDiagnostics(query.filePath);
    if (diagnostics.length === 0) {
        diagnostics = program.languageService.getSemanticDiagnostics(query.filePath);
    }

    return resolve({ errors: diagnostics.map(project.diagnosticToTSError) });
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
        /** Note that the Text Spans are from bottom of file to top of file */
        [filePath: string]: TextSpan[]
    };
}
export function getRenameInfo(query: GetRenameInfoQuery): Promise<GetRenameInfoResponse> {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var findInStrings = false, findInComments = false;
    var info = project.languageService.getRenameInfo(query.filePath, query.position);
    if (info && info.canRename) {
        var locations: { [filePath: string]: TextSpan[] } = {};
        project.languageService.findRenameLocations(query.filePath, query.position, findInStrings, findInComments)
            .forEach(loc=> {
            if (!locations[loc.fileName]) locations[loc.fileName] = [];

            // Using unshift makes them with maximum value on top ;)
            locations[loc.fileName].unshift(textSpan(loc.textSpan));
        });
        return resolve({
            canRename: true,
            localizedErrorMessage: info.localizedErrorMessage,
            displayName: info.displayName,
            fullDisplayName: info.fullDisplayName,
            kind: info.kind,
            kindModifiers: info.kindModifiers,
            triggerSpan: textSpan(info.triggerSpan),
            locations: locations
        })
    }
    else {
        return resolve({
            canRename: false
        });
    }
}

export interface GetRelativePathsInProjectQuery extends FilePathQuery {
    prefix: string;
}
export interface GetRelativePathsInProjectResponse {
    files: {
        name: string;
        relativePath: string;
        fullPath: string;
    }[];
    endsInPunctuation: boolean;
}
function filePathWithoutExtension(query: string) {
    var base = path.basename(query, '.ts');
    return path.dirname(query) + '/' + base;
}
export function getRelativePathsInProject(query: GetRelativePathsInProjectQuery): Promise<GetRelativePathsInProjectResponse> {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var sourceDir = path.dirname(query.filePath);
    var filePaths = project.projectFile.project.files.filter(p=> p !== query.filePath);

    var files = filePaths.map(p=> {
        return {
            name: path.basename(p, '.ts'),
            relativePath: tsconfig.removeExt(tsconfig.makeRelativePath(sourceDir, p)),
            fullPath: p
        };
    });

    var endsInPunctuation: boolean = prefixEndsInPunctuation(query.prefix);

    if (!endsInPunctuation)
        files = fuzzaldrin.filter(files, query.prefix, { key: 'name' });

    var response: GetRelativePathsInProjectResponse = {
        files: files,
        endsInPunctuation: endsInPunctuation
    };

    return resolve(response);
}

export interface GetIndentionAtPositionQuery extends FilePathPositionQuery { }
export interface GetIndentaionAtPositionResponse {
    indent: number;
}
export function getIndentationAtPosition(query: GetIndentionAtPositionQuery): Promise<GetIndentaionAtPositionResponse> {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var indent = project.languageService.getIndentationAtPosition(query.filePath, query.position, project.projectFile.project.format);

    return resolve({ indent });
}

export interface DebugLanguageServiceHostVersionQuery extends FilePathQuery { }
export interface DebugLanguageServiceHostVersionResponse { text: string }
export function debugLanguageServiceHostVersion(query: DebugLanguageServiceHostVersionQuery): Promise<DebugLanguageServiceHostVersionResponse> {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    return resolve({ text: project.languageServiceHost.getScriptContent(query.filePath) });
}
