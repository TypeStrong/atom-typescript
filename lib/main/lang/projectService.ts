
import * as fsu from "../utils/fsUtil";
import fs = require('fs');
import path = require('path');
import os = require('os');
import child_process = require("child_process");
import mkdirp = require('mkdirp');
var fuzzaldrin: { filter: (list: any[], prefix: string, property?: { key: string }) => any } = require('fuzzaldrin');
import {isTransformerFile} from "./transformers/transformer";
import * as transformer from "./transformers/transformer";

import tsconfig = require('../tsconfig/tsconfig');
import * as fsUtil from "../utils/fsUtil";

import utils = require('./utils');
import project = require('./core/project');
import Project = project.Project;
import languageServiceHost = project.languageServiceHost;

var resolve: typeof Promise.resolve = Promise.resolve.bind(Promise);

import {consistentPath,
FilePathQuery,
queryParent,
getOrCreateProject,
SoftResetQuery,
resetCache}
from "./projectCache";

////////////////////////////////////////////////////////////////////////////////////////
//////////////// MECHANISM FOR THE CHILD TO QUERY THE PARENT ///////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

//--------------------------------------------------------------------------
//  Utility Interfaces
//--------------------------------------------------------------------------

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
    if (!project.includesSourceFile(query.filePath)) {
        return Promise.resolve({ valid: false });
    }
    var info = project.languageService.getQuickInfoAtPosition(query.filePath, query.position);
    if (!info) {
        return Promise.resolve({ valid: false });
    } else {
        return resolve({
            valid: true,
            name: ts.displayPartsToString(info.displayParts || []),
            comment: ts.displayPartsToString(info.documentation || [])
        });
    }
}

export interface BuildQuery extends FilePathQuery { }
export interface BuildResponse {
    tsFilesWithInvalidEmit: string[];
    tsFilesWithValidEmit: string[];
    buildOutput: BuildOutput;
}
import building = require('./modules/building');
export function build(query: BuildQuery): Promise<BuildResponse> {
    consistentPath(query);
    var proj = getOrCreateProject(query.filePath);

    let filesToEmit = proj.projectFile.project.files.filter(fte => !fte.toLowerCase().endsWith('.json'));
    /** I am assuming there was at least one file. How else would we even get here? */
    filesToEmit = proj.projectFile.project.compilerOptions.out ? [filesToEmit[0]] : filesToEmit;

    let totalCount = filesToEmit.length;
    var builtCount = 0;
    var errorCount = 0;
    let outputs: EmitOutput[] = filesToEmit.map((filePath) => {
        var output = building.emitFile(proj, filePath);
        builtCount++;
        errorCount = errorCount + output.errors.length;
        queryParent.buildUpdate({
            totalCount,
            builtCount,
            errorCount,
            firstError: errorCount && !(errorCount - output.errors.length),
            filePath,
            errorsInFile: output.errors
        });
        return output;
    });

    // Also optionally emit a root dts:		
    building.emitDts(proj);

    // If there is a post build script to run ... run it
    if (proj.projectFile.project.scripts
        && proj.projectFile.project.scripts.postbuild) {
        child_process.exec(proj.projectFile.project.scripts.postbuild, { cwd: proj.projectFile.projectFileDirectory }, (err, stdout, stderr) => {
            if (err) {
                console.error('postbuild failed!');
                console.error(proj.projectFile.project.scripts.postbuild);
                console.error(stderr);
            }
        });
    }
    
    let tsFilesWithInvalidEmit = outputs
        .filter((o) => o.emitError)
        .map((o) => o.sourceFileName);
    let tsFilesWithValidEmit = outputs
        .filter((o) => !o.emitError)
        .map((o) => o.sourceFileName);

    return resolve({
        tsFilesWithInvalidEmit: tsFilesWithInvalidEmit,
        tsFilesWithValidEmit: tsFilesWithValidEmit,
        buildOutput: {
            outputs: outputs,
            counts: {
                inputFiles: proj.projectFile.project.files.length,
                outputFiles: utils.selectMany(outputs.map((out) => out.outputFiles)).length,
                errors: errorCount,
                emitErrors: outputs.filter(out => out.emitError).length
            }
        }
    });
}

export interface GetCompletionsAtPositionQuery extends FilePathPositionQuery {
    prefix: string;
}
export interface Completion {
    name?: string; // stuff like "toString"
    kind?: string; // stuff like "var"
    comment?: string; // the docComment if any
    display?: string; // This is either displayParts (for functions) or just the kind duplicated

    /** If snippet is specified then the above stuff is ignored */
    snippet?: string;
}
export interface GetCompletionsAtPositionResponse {
    completions: Completion[];
    endsInPunctuation: boolean;
}

export function getCompletionsAtPosition(query: GetCompletionsAtPositionQuery): Promise<GetCompletionsAtPositionResponse> {
    consistentPath(query);
    var filePath = query.filePath, position = query.position, prefix = query.prefix;
    var project = getOrCreateProject(filePath);

    // For transformer files
    filePath = transformer.getPseudoFilePath(filePath);

    var completions: ts.CompletionInfo = project.languageService.getCompletionsAtPosition(
        filePath, position);
    var completionList = completions ? completions.entries.filter(x=> !!x) : [];
    var endsInPunctuation = utils.prefixEndsInPunctuation(prefix);

    if (prefix.length && !endsInPunctuation) {
        // Didn't work good for punctuation
        completionList = fuzzaldrin.filter(completionList, prefix, { key: 'name' });
    }

    /** Doing too many suggestions is slowing us down in some cases */
    let maxSuggestions = 50;
    /** Doc comments slow us down tremendously */
    let maxDocComments = 10;

    // limit to maxSuggestions
    if (completionList.length > maxSuggestions) completionList = completionList.slice(0, maxSuggestions);

    // Potentially use it more aggresively at some point
    function docComment(c: ts.CompletionEntry): { display: string; comment: string; } {
        var completionDetails = project.languageService.getCompletionEntryDetails(filePath, position, c.name);

        // Show the signatures for methods / functions
        var display: string;
        if (c.kind == "method" || c.kind == "function" || c.kind == "property") {
            let parts = completionDetails.displayParts || [];
            // don't show `(method)` or `(function)` as that is taken care of by `kind`
            if (parts.length > 3) {
                parts = parts.splice(3);
            }
            display = ts.displayPartsToString(parts);
        }
        else {
            display = '';
        }
        var comment = (display ? display + '\n' : '') + ts.displayPartsToString(completionDetails.documentation || []);

        return { display: display, comment: comment };
    }

    var completionsToReturn: Completion[] = completionList.map((c, index) => {
        if (index < maxDocComments) {
            var details = docComment(c);
        }
        else {
            details = {
                display: '',
                comment: ''
            }
        }
        return {
            name: c.name,
            kind: c.kind,
            comment: details.comment,
            display: details.display
        };
    });

    if (query.prefix == '(') {
        var signatures = project.languageService.getSignatureHelpItems(query.filePath, query.position);
        if (signatures && signatures.items) {
            signatures.items.forEach((item) => {
                var snippet: string = item.parameters.map((p, i) => {
                    var display = '${' + (i + 1) + ':' + ts.displayPartsToString(p.displayParts) + '}';
                    if (i === signatures.argumentIndex) {
                        return display;
                    }
                    return display;
                }).join(ts.displayPartsToString(item.separatorDisplayParts));

                // We do not use the label for now. But it looks too good to kill off
                var label: string = ts.displayPartsToString(item.prefixDisplayParts)
                    + snippet
                    + ts.displayPartsToString(item.suffixDisplayParts);

                completionsToReturn.unshift({ snippet });
            });
        }
    }

    return resolve({
        completions: completionsToReturn,
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
export interface EmitFileResponse extends EmitOutput { }
export function emitFile(query: EmitFileQuery): Promise<EmitFileResponse> {
    consistentPath(query);
    var filePath = transformer.getPseudoFilePath(query.filePath);
    return resolve(building.emitFile(getOrCreateProject(filePath), filePath));
}

import formatting = require('./modules/formatting');
export interface FormatDocumentQuery extends FilePathQuery {
}
export interface FormatDocumentResponse {
    edits: CodeEdit[];
}
export function formatDocument(query: FormatDocumentQuery): Promise<FormatDocumentResponse> {
    consistentPath(query);
    var proj = getOrCreateProject(query.filePath);
    return resolve({ edits: formatting.formatDocument(proj, query.filePath) });
}

export interface FormatDocumentRangeQuery extends FilePathQuery {
    start: EditorPosition;
    end: EditorPosition;
}
export interface FormatDocumentRangeResponse { edits: CodeEdit[]; }
export function formatDocumentRange(query: FormatDocumentRangeQuery): Promise<FormatDocumentRangeResponse> {
    consistentPath(query);
    var proj = getOrCreateProject(query.filePath);
    return resolve({ edits: formatting.formatDocumentRange(proj, query.filePath, query.start, query.end) });
}

export interface GetDefinitionsAtPositionQuery extends FilePathPositionQuery { }
export interface GetDefinitionsAtPositionResponse {
    projectFileDirectory: string;
    definitions: {
        filePath: string;
        position: EditorPosition
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
    var lsh = getOrCreateProject(query.filePath).languageServiceHost;

    // Apply the update to the pseudo ts file
    var filePath = transformer.getPseudoFilePath(query.filePath);
    lsh.updateScript(filePath, query.text);
    return resolve({});
}

export interface EditTextQuery extends FilePathQuery {
    start: EditorPosition;
    end: EditorPosition;
    newText: string;
}
export function editText(query: EditTextQuery): Promise<any> {
    consistentPath(query);
    let project = getOrCreateProject(query.filePath);
    if (project.includesSourceFile(query.filePath)) {
        let lsh = project.languageServiceHost;
        // Apply the update to the pseudo ts file
        let filePath = transformer.getPseudoFilePath(query.filePath);
        lsh.editScript(filePath, query.start, query.end, query.newText);
    }
    return resolve({});
}

/** Utility function */
function getDiagnositcsByFilePath(query: FilePathQuery) {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var diagnostics = project.languageService.getSyntacticDiagnostics(query.filePath);
    if (diagnostics.length === 0) {
        diagnostics = project.languageService.getSemanticDiagnostics(query.filePath);
    }
    return diagnostics;
}

export function errorsForFile(query: FilePathQuery): Promise<{
    errors: CodeError[]
}> {
    consistentPath(query);
    let project: project.Project;

    try {
        project = getOrCreateProject(query.filePath);
    } catch (ex) {
        return resolve({ errors: [] });
    }

    // for file path errors in transformer
    if (isTransformerFile(query.filePath)) {
        let filePath = transformer.getPseudoFilePath(query.filePath);
        let errors = getDiagnositcsByFilePath({ filePath }).map(building.diagnosticToTSError);
        errors.forEach(error => {
            error.filePath = query.filePath;
        });
        return resolve({ errors: errors });
    }
    else {
        let result: CodeError[];

        if (project.includesSourceFile(query.filePath)) {
            result = getDiagnositcsByFilePath(query).map(building.diagnosticToTSError);
        } else {
            result = notInContextResult(query.filePath);
        }

        return resolve({ errors: result });
    }
}

function notInContextResult(fileName: string) {
    return [{
        filePath: fileName,
        startPos: { line: 0, col: 0 },
        endPos: { line: 0, col: 0 },
        message: "The file \"" + fileName + "\" is not included in the TypeScript compilation context.  If this is not intended, please check the \"files\" or \"filesGlob\" section of your tsconfig.json file.",
        preview: ""
    }];
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

export interface GetIndentionAtPositionQuery extends FilePathPositionQuery { }
export interface GetIndentaionAtPositionResponse {
    indent: number;
}
export function getIndentationAtPosition(query: GetIndentionAtPositionQuery): Promise<GetIndentaionAtPositionResponse> {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var indent = project.languageService.getIndentationAtPosition(query.filePath, query.position, project.projectFile.project.formatCodeOptions);

    return resolve({ indent });
}

export interface DebugLanguageServiceHostVersionQuery extends FilePathQuery { }
export interface DebugLanguageServiceHostVersionResponse { text: string }
export function debugLanguageServiceHostVersion(query: DebugLanguageServiceHostVersionQuery): Promise<DebugLanguageServiceHostVersionResponse> {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    return resolve({ text: project.languageServiceHost.getScriptContent(query.filePath) });
}

export interface GetProjectFileDetailsQuery extends FilePathQuery { }
export interface GetProjectFileDetailsResponse extends tsconfig.TypeScriptProjectFileDetails { }
export function getProjectFileDetails(query: GetProjectFileDetailsQuery): Promise<GetProjectFileDetailsResponse> {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    return resolve(project.projectFile);
}


//--------------------------------------------------------------------------
//  getNavigationBarItems
//--------------------------------------------------------------------------

export interface GetNavigationBarItemsResponse {
    items: NavigationBarItem[];
}

function sortNavbarItemsBySpan(items: ts.NavigationBarItem[]) {
    items.sort((a, b) => a.spans[0].start - b.spans[0].start);

    // sort children recursively
    for (let item of items) {
        if (item.childItems) {
            sortNavbarItemsBySpan(item.childItems);
        }
    }
}
/**
 * Note the `indent` is fairly useless in ts service
 * Basically only exists for global / module level and 0 elsewhere
 * We make it true indent here ;)
 */
function flattenNavBarItems(items: ts.NavigationBarItem[]): ts.NavigationBarItem[] {

    var toreturn: ts.NavigationBarItem[] = [];
    function keepAdding(item: ts.NavigationBarItem, depth: number) {
        item.indent = depth;
        var children = item.childItems;
        delete item.childItems;
        toreturn.push(item);

        if (children) {
            children.forEach(child => keepAdding(child, depth + 1));
        }
    }
    // Kick it off
    items.forEach(item => keepAdding(item, 0));

    return toreturn;
}

export function getNavigationBarItems(query: FilePathQuery): Promise<GetNavigationBarItemsResponse> {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var languageService = project.languageService;
    var navBarItems = languageService.getNavigationBarItems(query.filePath);

    // remove the first global (whatever that is???)
    if (navBarItems.length && navBarItems[0].text == "<global>") {
        navBarItems.shift();
    }

    // Sort items by first spans:
    sortNavbarItemsBySpan(navBarItems);

    // And flatten
    navBarItems = flattenNavBarItems(navBarItems);

    // Add a position
    var items = navBarItems.map(item=> {
        (<any>item).position = project.languageServiceHost.getPositionFromIndex(query.filePath, item.spans[0].start);
        delete item.spans;
        return <NavigationBarItem><any>item;
    })

    return resolve({ items });
}

export interface SemanticTreeQuery extends FilePathQuery { }
export interface SemanticTreeReponse {
    nodes: SemanticTreeNode[];
}
function navigationBarItemToSemanticTreeNode(item: ts.NavigationBarItem, project: project.Project, query: FilePathQuery): SemanticTreeNode {
    var toReturn: SemanticTreeNode = {
        text: item.text,
        kind: item.kind,
        kindModifiers: item.kindModifiers,
        start: project.languageServiceHost.getPositionFromIndex(query.filePath, item.spans[0].start),
        end: project.languageServiceHost.getPositionFromIndex(query.filePath, item.spans[0].start + item.spans[0].length),
        subNodes: item.childItems ? item.childItems.map(ci => navigationBarItemToSemanticTreeNode(ci, project, query)) : []
    }
    return toReturn;
}
export function getSemtanticTree(query: SemanticTreeQuery): Promise<SemanticTreeReponse> {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);

    var navBarItems = project.languageService.getNavigationBarItems(query.filePath);

    // remove the first global (whatever that is???)
    if (navBarItems.length && navBarItems[0].text == "<global>") {
        navBarItems.shift();
    }

    // Sort items by first spans:
    sortNavbarItemsBySpan(navBarItems);

    // convert to SemanticTreeNodes
    var nodes = navBarItems.map(nbi => navigationBarItemToSemanticTreeNode(nbi, project, query));

    return resolve({ nodes });
}

//--------------------------------------------------------------------------
//  getNavigateToItems
//--------------------------------------------------------------------------

// Look at
// https://github.com/Microsoft/TypeScript/blob/master/src/services/navigateTo.ts
// for inspiration
// Reason for forking:
//  didn't give all results
//  gave results from lib.d.ts
//  I wanted the practice

export interface GetNavigateToItemsResponse {
    items: NavigateToItem[];
}
export function getNavigateToItems(query: FilePathQuery): Promise<GetNavigateToItemsResponse> {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var languageService = project.languageService;

    let getNodeKind = ts.getNodeKind;
    function getDeclarationName(declaration: ts.Declaration): string {
        let result = getTextOfIdentifierOrLiteral(declaration.name);
        if (result !== undefined) {
            return result;
        }

        if (declaration.name.kind === ts.SyntaxKind.ComputedPropertyName) {
            let expr = (<ts.ComputedPropertyName>declaration.name).expression;
            if (expr.kind === ts.SyntaxKind.PropertyAccessExpression) {
                return (<ts.PropertyAccessExpression>expr).name.text;
            }

            return getTextOfIdentifierOrLiteral(expr);
        }

        return undefined;
    }
    function getTextOfIdentifierOrLiteral(node: ts.Node) {
        if (node.kind === ts.SyntaxKind.Identifier ||
            node.kind === ts.SyntaxKind.StringLiteral ||
            node.kind === ts.SyntaxKind.NumericLiteral) {

            return (<ts.Identifier | ts.LiteralExpression > node).text;
        }

        return undefined;
    }

    var items: NavigateToItem[] = [];
    for (let file of project.getProjectSourceFiles()) {
        let declarations = file.getNamedDeclarations();
        for (let index in declarations) {
            for (let declaration of declarations[index]) {
                let item: NavigateToItem = {
                    name: getDeclarationName(declaration),
                    kind: getNodeKind(declaration),
                    filePath: file.fileName,
                    fileName: path.basename(file.fileName),
                    position: project.languageServiceHost.getPositionFromIndex(file.fileName, declaration.getStart())
                }
                items.push(item);
            }
        }
    }

    return resolve({ items });
}

//--------------------------------------------------------------------------
//  getReferences
//--------------------------------------------------------------------------
export interface GetReferencesQuery extends FilePathPositionQuery { }
export interface GetReferencesResponse {
    references: ReferenceDetails[];
}
export function getReferences(query: GetReferencesQuery): Promise<GetReferencesResponse> {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var languageService = project.languageService;

    var references: ReferenceDetails[] = [];
    var refs = languageService.getReferencesAtPosition(query.filePath, query.position) || [];

    references = refs.map(r=> {
        var res = project.languageServiceHost.getPositionFromTextSpanWithLinePreview(r.fileName, r.textSpan);
        return { filePath: r.fileName, position: res.position, preview: res.preview }
    });

    return resolve({
        references
    })
}

/**
 * Get Completions for external modules + references tags
 */
import {getPathCompletions, GetRelativePathsInProjectResponse }
from "./modules/getPathCompletions";

function filePathWithoutExtension(query: string) {
    var base = path.basename(query, '.ts');
    return path.dirname(query) + '/' + base;
}
interface GetRelativePathsInProjectQuery {
    filePath: string;
    prefix: string;
    includeExternalModules: boolean;
}

export function getRelativePathsInProject(query: GetRelativePathsInProjectQuery): Promise<GetRelativePathsInProjectResponse> {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    return resolve(getPathCompletions({
        project,
        filePath: query.filePath,
        prefix: query.prefix,
        includeExternalModules: query.includeExternalModules
    }));
}

/**
 * Get AST
 */
import {astToText, astToTextFull} from "./modules/astToText";
export interface GetASTQuery extends FilePathQuery { }
export interface GetASTResponse {
    root?: NodeDisplay
}
export function getAST(query: GetASTQuery): Promise<GetASTResponse> {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var service = project.languageService;

    var files = service.getProgram().getSourceFiles().filter(x=> x.fileName == query.filePath);
    if (!files.length) resolve({});

    var sourceFile = files[0];

    var root = astToText(sourceFile);

    return resolve({ root });
}

export interface GetASTFullQuery extends FilePathQuery { }
export interface GetASTFullResponse {
    root?: NodeDisplay
}
export function getASTFull(query: GetASTQuery): Promise<GetASTResponse> {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var service = project.languageService;

    var files = service.getProgram().getSourceFiles().filter(x=> x.fileName == query.filePath);
    if (!files.length) resolve({});

    var sourceFile = files[0];

    var root = astToTextFull(sourceFile);

    return resolve({ root });
}

/**
 * Get Dependencies
 */
import programDependencies from "./modules/programDependencies";
export interface GetDependenciesQuery extends FilePathQuery { }
export interface GetDependenciesResponse {
    links: FileDependency[]
}
export function getDependencies(query: GetDependenciesQuery): Promise<GetDependenciesResponse> {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);

    var projectFile = project.projectFile;
    var links = programDependencies(projectFile, project.languageService.getProgram());

    return resolve({ links });
}

/**
 * Get Quick Fix
 */
import {QuickFix, QuickFixQueryInformation, Refactoring} from "./fixmyts/quickFix";
import * as qf from "./fixmyts/quickFix";
import * as ast from "./fixmyts/astUtils";
import {allQuickFixes} from "./fixmyts/quickFixRegistry";
function getInfoForQuickFixAnalysis(query: FilePathPositionQuery): QuickFixQueryInformation {
    consistentPath(query);
    let project = getOrCreateProject(query.filePath);
    let program = project.languageService.getProgram();
    let sourceFile = program.getSourceFile(query.filePath);
    let sourceFileText: string,
        fileErrors: ts.Diagnostic[],
        positionErrors: ts.Diagnostic[],
        positionErrorMessages: string[],
        positionNode: ts.Node;
    if (project.includesSourceFile(query.filePath)) {
        sourceFileText = sourceFile.getFullText();
        fileErrors = getDiagnositcsByFilePath(query);
        /** We want errors that are *touching* and thefore expand the query position by one */
        positionErrors = fileErrors.filter(e=> ((e.start - 1) < query.position) && (e.start + e.length + 1) > query.position);
        positionErrorMessages = positionErrors.map(e=> ts.flattenDiagnosticMessageText(e.messageText, os.EOL));
        positionNode = ts.getTokenAtPosition(sourceFile, query.position);
    } else {
        sourceFileText = "";
        fileErrors = [];
        positionErrors = [];
        positionErrorMessages = [];
        positionNode = undefined;
    }

    let service = project.languageService;
    let typeChecker = program.getTypeChecker();

    return {
        project,
        program,
        sourceFile,
        sourceFileText,
        fileErrors,
        positionErrors,
        positionErrorMessages,
        position: query.position,
        positionNode,
        service,
        typeChecker,
        filePath: query.filePath
    };
}

export interface GetQuickFixesQuery extends FilePathPositionQuery { }
export interface QuickFixDisplay {
    /** Uniquely identifies which function will be called to carry out the fix */
    key: string;
    /** What will be displayed in the UI */
    display: string;
    /** Does this quickfix provide a snippet */
    isNewTextSnippet: boolean;
}
export interface GetQuickFixesResponse {
    fixes: QuickFixDisplay[];
}
export function getQuickFixes(query: GetQuickFixesQuery): Promise<GetQuickFixesResponse> {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);

    if (!project.includesSourceFile(query.filePath)) {
        return resolve({ fixes: [] });
    }

    var info = getInfoForQuickFixAnalysis(query);

    // And then we let the quickFix determine if it wants provide any fixes for this file
    // And if so we also treat the result as a display string
    var fixes = allQuickFixes
        .map(x => {
            var canProvide = x.canProvideFix(info);
            if (!canProvide)
                return;
            else
                return { key: x.key, display: canProvide.display, isNewTextSnippet: canProvide.isNewTextSnippet };
        })
        .filter(x=> !!x);

    return resolve({ fixes });
}

export interface ApplyQuickFixQuery extends FilePathPositionQuery {
    key: string;

    // This will need to be special cased
    additionalData?: any;
}
export interface ApplyQuickFixResponse {
    refactorings: qf.RefactoringsByFilePath;
}
export function applyQuickFix(query: ApplyQuickFixQuery): Promise<ApplyQuickFixResponse> {
    consistentPath(query);

    var fix = allQuickFixes.filter(x=> x.key == query.key)[0];
    var info = getInfoForQuickFixAnalysis(query);
    var res = fix.provideFix(info);
    var refactorings = qf.getRefactoringsByFilePath(res);
    return resolve({ refactorings });
}


/**
 * Get Output for possible use elsewhere
 */
interface GetOutputResponse {
    output: ts.EmitOutput;
}
import {getRawOutput} from "./modules/building";
export function getOutput(query: FilePathQuery): Promise<GetOutputResponse> {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    return resolve({ output: getRawOutput(project, query.filePath) });
}
interface GetOutputJsResponse {
    jsFilePath?: string;
}
export function getOutputJs(query: FilePathQuery): Promise<GetOutputJsResponse> {
    consistentPath(query);

    var project = getOrCreateProject(query.filePath);
    var output = getRawOutput(project, query.filePath);
    var jsFile = output.outputFiles.filter(x=> path.extname(x.name) == ".js" || path.extname(x.name) == ".jsx")[0];

    if (!jsFile || output.emitSkipped) {
        return resolve({});
    } else {
        return resolve({ jsFilePath: jsFile.name });
    }
}
interface GetOutputJsStatusResponse {
    /** true if *no emit* or *emit is as desired* */
    emitDiffers: boolean;
}
export function getOutputJsStatus(query: FilePathQuery): Promise<GetOutputJsStatusResponse> {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var output = getRawOutput(project, query.filePath);
    if (output.emitSkipped) {
        if (output.outputFiles && output.outputFiles.length === 1) {
            if (output.outputFiles[0].text === building.Not_In_Context) {
                return resolve({ emitDiffers: false });
            }
        }
        return resolve({ emitDiffers: true });
    }
    var jsFile = output.outputFiles.filter(x=> path.extname(x.name) == ".js")[0];
    if (!jsFile) {
        return resolve({ emitDiffers: false });
    } else {
        var emitDiffers = !fs.existsSync(jsFile.name) || fs.readFileSync(jsFile.name).toString() !== jsFile.text;
        return resolve({ emitDiffers });
    }
}

/**
 * Reset all that we know about the file system
 */
export function softReset(query: SoftResetQuery): Promise<{}> {
    resetCache(query);
    return resolve({});
}

/**
 * Get rename files refactorings
 */
import * as moveFiles from "./modules/moveFiles";
export interface GetRenameFilesRefactoringsQuery {
    oldPath: string;
    newPath: string;
}
export function getRenameFilesRefactorings(query: GetRenameFilesRefactoringsQuery): Promise<ApplyQuickFixResponse> {
    query.oldPath = fsu.consistentPath(query.oldPath);
    query.newPath = fsu.consistentPath(query.newPath);
    var project = getOrCreateProject(query.oldPath);
    var res = moveFiles.getRenameFilesRefactorings(project.languageService.getProgram(), query.oldPath, query.newPath);
    var refactorings = qf.getRefactoringsByFilePath(res);
    return resolve({ refactorings });
}

export interface CreateProjectQuery extends FilePathQuery { }
export interface CreateProjectResponse {
    createdFilePath: string;
}
export function createProject(query: CreateProjectQuery): Promise<CreateProjectResponse> {
    consistentPath(query);
    var projectFile = tsconfig.createProjectRootSync(query.filePath);
    queryParent.setConfigurationError({ projectFilePath: query.filePath, error: null });
    return resolve({ createdFilePath: projectFile.projectFilePath });
}

/**
 * Toggle breakpoint
 */
export interface ToggleBreakpointQuery extends FilePathPositionQuery { }
export interface ToggleBreakpointResponse {
    refactorings: qf.RefactoringsByFilePath;
}
export function toggleBreakpoint(query: ToggleBreakpointQuery): Promise<ToggleBreakpointResponse> {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);

    // Get the node at the current location.
    let program = project.languageService.getProgram();
    let sourceFile = program.getSourceFile(query.filePath);
    let sourceFileText = sourceFile.getFullText();
    let positionNode = ts.getTokenAtPosition(sourceFile, query.position);

    let refactoring: Refactoring;

    // Because we add a debugger *before* the current token
    //  ... just preemptively check the previous token to see if *that* is a debugger keyword by any chance
    if (positionNode.kind != ts.SyntaxKind.DebuggerKeyword && positionNode.getFullStart() > 0) {
        let previousNode = ts.getTokenAtPosition(sourceFile, positionNode.getFullStart() - 1);
        // Note: the previous node might be `debugger`
        if (previousNode.kind == ts.SyntaxKind.DebuggerStatement) {
            positionNode = previousNode;
        }
        // Or `debugger;` (previous node would be `;` but parent is the right one)
        if (previousNode.parent && previousNode.parent.kind == ts.SyntaxKind.DebuggerStatement) {
            positionNode = previousNode.parent;
        }
    }

    // If it is a debugger keyword ... remove it
    if (positionNode.kind == ts.SyntaxKind.DebuggerKeyword || positionNode.kind == ts.SyntaxKind.DebuggerStatement) {
        let start = positionNode.getFullStart();
        let end = start + positionNode.getFullWidth();

        // also get trailing semicolons
        while (end < sourceFileText.length && sourceFileText[end] == ';') {
            end = end + 1;
        }

        refactoring = {
            filePath: query.filePath,
            span: {
                start: start,
                length: end - start
            },
            newText: ''
        }
    }
    // Otherwise add a breakpoint; *before* the current token whatever that may be
    else {
        let toInsert = 'debugger;';
        refactoring = {
            filePath: query.filePath,
            span: {
                start: positionNode.getFullStart(),
                length: 0
            },
            newText: toInsert
        }
    }

    var refactorings = qf.getRefactoringsByFilePath(refactoring ? [refactoring] : []);
    return resolve({ refactorings });
}
