

import fs = require('fs');
import path = require('path');
import os = require('os');
import mkdirp = require('mkdirp');
var fuzzaldrin: { filter: (list: any[], prefix: string, property?: { key: string }) => any } = require('fuzzaldrin');

import tsconfig = require('../tsconfig/tsconfig');

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
    buildOutput: BuildOutput;
}
import building = require('./modules/building');
export function build(query: BuildQuery): Promise<BuildResponse> {
    consistentPath(query);
    var proj = getOrCreateProject(query.filePath);

    var totalCount = proj.projectFile.project.files.length;
    var builtCount = 0;
    var errorCount = 0;
    var outputs = proj.projectFile.project.files.map((filePath) => {
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

    return resolve({
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

/** Filtered means *only* for this file i.e. exclude errors from files it references/imports */
export interface ErrorsForFileFilteredQuery extends FilePathQuery { }
export interface ErrorsForFileFilteredResponse {
    errors: TSError[];
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
            display = c.kind;
        }
        var comment = ts.displayPartsToString(completionDetails.documentation || []);

        return { display: display, comment: comment };
    }

    var completionsToReturn: Completion[] = completionList.map((c, index) => {
        if (index < maxDocComments) {
            var details = docComment(c);
        }
        else {
            details = {
                display: c.kind,
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
    return resolve(building.emitFile(getOrCreateProject(query.filePath), query.filePath));
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
    errors: TSError[]
}> {
    consistentPath(query);
    return resolve({ errors: getDiagnositcsByFilePath(query).map(building.diagnosticToTSError) });
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
import AddClassMember from "./fixmyts/addClassMember";
import AddImportStatement from "./fixmyts/addImportStatement";
import EqualsToEquals from "./fixmyts/equalsToEquals";
import QuotesToQuotes from "./fixmyts/quotesToQuotes";
import QuotesToTemplate from "./fixmyts/quoteToTemplate";
import StringConcatToTemplate from "./fixmyts/stringConcatToTemplate";
var allQuickFixes: QuickFix[] = [
    new AddClassMember(),
    new AddImportStatement(),
    new EqualsToEquals(),
    new StringConcatToTemplate(),
    new QuotesToQuotes(),
    new QuotesToTemplate(),
];

function getInfoForQuickFixAnalysis(query: FilePathPositionQuery): QuickFixQueryInformation {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var program = project.languageService.getProgram();
    var srcFile = program.getSourceFile(query.filePath);
    var fileErrors = getDiagnositcsByFilePath(query);
    var positionErrors = fileErrors.filter(e=> (e.start < query.position) && (e.start + e.length) > query.position);
    var positionNode: ts.Node = ts.getTokenAtPosition(srcFile, query.position);
    var service = project.languageService;
    var typeChecker = program.getTypeChecker();

    return {
        project,
        program,
        srcFile,
        fileErrors,
        positionErrors,
        position: query.position,
        positionNode,
        service,
        typeChecker,
        filePath: srcFile.fileName
    };
}

export interface GetQuickFixesQuery extends FilePathPositionQuery { }
export interface QuickFixDisplay {
    /** Uniquely identifies which function will be called to carry out the fix */
    key: string;
    /** What will be displayed in the UI */
    display: string;
}
export interface GetQuickFixesResponse {
    fixes: QuickFixDisplay[];
}
export function getQuickFixes(query: GetQuickFixesQuery): Promise<GetQuickFixesResponse> {
    consistentPath(query);
    var info = getInfoForQuickFixAnalysis(query);

    // And then we let the quickFix determine if it wants provide any fixes for this file
    // And if so we also treat the result as a display string
    var fixes = allQuickFixes.map(x => { return { key: x.key, display: x.canProvideFix(info) } }).filter(x=> !!x.display);

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


/**
 * Reset all that we know about the file system
 */
export function softReset(query: SoftResetQuery): Promise<{}> {
    resetCache(query);
    return resolve({});
}
