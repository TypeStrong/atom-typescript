"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fsu = require("../utils/fsUtil");
const fs = require("fs");
const path = require("path");
const os = require("os");
const child_process = require("child_process");
var fuzzaldrin = require('fuzzaldrin');
const transformer_1 = require("./transformers/transformer");
const transformer = require("./transformers/transformer");
const tsconfig = require("../tsconfig/tsconfig");
const utils = require("./utils");
var resolve = Promise.resolve.bind(Promise);
const projectCache_1 = require("./projectCache");
function textSpan(span) {
    return {
        start: span.start,
        length: span.length
    };
}
function echo(data) {
    return projectCache_1.queryParent.echoNumWithModification({ num: data.num }).then((resp) => {
        data.num = resp.num;
        return data;
    });
}
exports.echo = echo;
function quickInfo(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    if (!project.includesSourceFile(query.filePath)) {
        return Promise.resolve({ valid: false });
    }
    var info = project.languageService.getQuickInfoAtPosition(query.filePath, query.position);
    if (!info) {
        return Promise.resolve({ valid: false });
    }
    else {
        return resolve({
            valid: true,
            name: ts.displayPartsToString(info.displayParts || []),
            comment: ts.displayPartsToString(info.documentation || [])
        });
    }
}
exports.quickInfo = quickInfo;
const building = require("./modules/building");
function build(query) {
    projectCache_1.consistentPath(query);
    var proj = projectCache_1.getOrCreateProject(query.filePath);
    let filesToEmit = proj.projectFile.project.files.filter(fte => !fte.toLowerCase().endsWith('.json'));
    /** I am assuming there was at least one file. How else would we even get here? */
    filesToEmit = proj.projectFile.project.compilerOptions.outFile ? [filesToEmit[0]] : filesToEmit;
    let totalCount = filesToEmit.length;
    var builtCount = 0;
    var errorCount = 0;
    let outputs = filesToEmit.map((filePath) => {
        var output = building.emitFile(proj, filePath);
        builtCount++;
        errorCount = errorCount + output.errors.length;
        projectCache_1.queryParent.buildUpdate({
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
exports.build = build;
function getCompletionsAtPosition(query) {
    projectCache_1.consistentPath(query);
    var filePath = query.filePath, position = query.position, prefix = query.prefix;
    var project = projectCache_1.getOrCreateProject(filePath);
    // For transformer files
    filePath = transformer.getPseudoFilePath(filePath);
    var completions = project.languageService.getCompletionsAtPosition(filePath, position);
    var completionList = completions ? completions.entries.filter(x => !!x) : [];
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
    if (completionList.length > maxSuggestions)
        completionList = completionList.slice(0, maxSuggestions);
    // Potentially use it more aggresively at some point
    function docComment(c) {
        var completionDetails = project.languageService.getCompletionEntryDetails(filePath, position, c.name);
        // Show the signatures for methods / functions
        var display;
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
    var completionsToReturn = completionList.map((c, index) => {
        if (index < maxDocComments) {
            var details = docComment(c);
        }
        else {
            details = {
                display: '',
                comment: ''
            };
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
                var snippet = item.parameters.map((p, i) => {
                    var display = '${' + (i + 1) + ':' + ts.displayPartsToString(p.displayParts) + '}';
                    if (i === signatures.argumentIndex) {
                        return display;
                    }
                    return display;
                }).join(ts.displayPartsToString(item.separatorDisplayParts));
                // We do not use the label for now. But it looks too good to kill off
                var label = ts.displayPartsToString(item.prefixDisplayParts)
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
exports.getCompletionsAtPosition = getCompletionsAtPosition;
function getSignatureHelps(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var signatureHelpItems = project.languageService.getSignatureHelpItems(query.filePath, query.position);
    if (!signatureHelpItems || !signatureHelpItems.items || !signatureHelpItems.items.length)
        return resolve({ signatureHelps: [] });
    // TODO: WIP
    return signatureHelpItems.items;
}
exports.getSignatureHelps = getSignatureHelps;
function emitFile(query) {
    projectCache_1.consistentPath(query);
    var filePath = transformer.getPseudoFilePath(query.filePath);
    return resolve(building.emitFile(projectCache_1.getOrCreateProject(filePath), filePath));
}
exports.emitFile = emitFile;
const formatting = require("./modules/formatting");
function formatDocument(query) {
    projectCache_1.consistentPath(query);
    var proj = projectCache_1.getOrCreateProject(query.filePath);
    return resolve({ edits: formatting.formatDocument(proj, query.filePath) });
}
exports.formatDocument = formatDocument;
function formatDocumentRange(query) {
    projectCache_1.consistentPath(query);
    var proj = projectCache_1.getOrCreateProject(query.filePath);
    return resolve({ edits: formatting.formatDocumentRange(proj, query.filePath, query.start, query.end) });
}
exports.formatDocumentRange = formatDocumentRange;
function getDefinitionsAtPosition(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var definitions = project.languageService.getDefinitionAtPosition(query.filePath, query.position);
    var projectFileDirectory = project.projectFile.projectFileDirectory;
    if (!definitions || !definitions.length)
        return resolve({ projectFileDirectory: projectFileDirectory, definitions: [] });
    return resolve({
        projectFileDirectory: projectFileDirectory,
        definitions: definitions.map(d => {
            // If we can get the filename *we are in the same program :P*
            var pos = project.languageServiceHost.getPositionFromIndex(d.fileName, d.textSpan.start);
            return {
                filePath: d.fileName,
                position: pos
            };
        })
    });
}
exports.getDefinitionsAtPosition = getDefinitionsAtPosition;
function updateText(query) {
    projectCache_1.consistentPath(query);
    var lsh = projectCache_1.getOrCreateProject(query.filePath).languageServiceHost;
    // Apply the update to the pseudo ts file
    var filePath = transformer.getPseudoFilePath(query.filePath);
    lsh.updateScript(filePath, query.text);
    return resolve({});
}
exports.updateText = updateText;
function editText(query) {
    projectCache_1.consistentPath(query);
    let project = projectCache_1.getOrCreateProject(query.filePath);
    if (project.includesSourceFile(query.filePath)) {
        let lsh = project.languageServiceHost;
        // Apply the update to the pseudo ts file
        let filePath = transformer.getPseudoFilePath(query.filePath);
        lsh.editScript(filePath, query.start, query.end, query.newText);
    }
    return resolve({});
}
exports.editText = editText;
/** Utility function */
function getDiagnositcsByFilePath(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var diagnostics = project.languageService.getSyntacticDiagnostics(query.filePath);
    if (diagnostics.length === 0) {
        diagnostics = project.languageService.getSemanticDiagnostics(query.filePath);
    }
    return diagnostics;
}
function errorsForFile(query) {
    projectCache_1.consistentPath(query);
    let project;
    try {
        project = projectCache_1.getOrCreateProject(query.filePath);
    }
    catch (ex) {
        return resolve({ errors: [] });
    }
    // for file path errors in transformer
    if (transformer_1.isTransformerFile(query.filePath)) {
        let filePath = transformer.getPseudoFilePath(query.filePath);
        let errors = getDiagnositcsByFilePath({ filePath }).map(building.diagnosticToTSError);
        errors.forEach(error => {
            error.filePath = query.filePath;
        });
        return resolve({ errors: errors });
    }
    else {
        let result;
        if (project.includesSourceFile(query.filePath)) {
            result = getDiagnositcsByFilePath(query).map(building.diagnosticToTSError);
        }
        else {
            result = notInContextResult(query.filePath);
        }
        return resolve({ errors: result });
    }
}
exports.errorsForFile = errorsForFile;
function notInContextResult(fileName) {
    return [{
            filePath: fileName,
            startPos: { line: 0, col: 0 },
            endPos: { line: 0, col: 0 },
            message: "The file \"" + fileName + "\" is not included in the TypeScript compilation context.  If this is not intended, please check the \"files\" or \"filesGlob\" section of your tsconfig.json file.",
            preview: ""
        }];
}
function getRenameInfo(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var findInStrings = false, findInComments = false;
    var info = project.languageService.getRenameInfo(query.filePath, query.position);
    if (info && info.canRename) {
        var locations = {};
        project.languageService.findRenameLocations(query.filePath, query.position, findInStrings, findInComments)
            .forEach(loc => {
            if (!locations[loc.fileName])
                locations[loc.fileName] = [];
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
        });
    }
    else {
        return resolve({
            canRename: false
        });
    }
}
exports.getRenameInfo = getRenameInfo;
function getIndentationAtPosition(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var indent = project.languageService.getIndentationAtPosition(query.filePath, query.position, project.projectFile.project.formatCodeOptions);
    return resolve({ indent });
}
exports.getIndentationAtPosition = getIndentationAtPosition;
function debugLanguageServiceHostVersion(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    return resolve({ text: project.languageServiceHost.getScriptContent(query.filePath) });
}
exports.debugLanguageServiceHostVersion = debugLanguageServiceHostVersion;
function getProjectFileDetails(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    return resolve(project.projectFile);
}
exports.getProjectFileDetails = getProjectFileDetails;
function sortNavbarItemsBySpan(items) {
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
function flattenNavBarItems(items) {
    var toreturn = [];
    function keepAdding(item, depth) {
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
function getNavigationBarItems(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
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
    var items = navBarItems.map(item => {
        item.position = project.languageServiceHost.getPositionFromIndex(query.filePath, item.spans[0].start);
        delete item.spans;
        return item;
    });
    return resolve({ items });
}
exports.getNavigationBarItems = getNavigationBarItems;
function navigationBarItemToSemanticTreeNode(item, project, query) {
    var toReturn = {
        text: item.text,
        kind: item.kind,
        kindModifiers: item.kindModifiers,
        start: project.languageServiceHost.getPositionFromIndex(query.filePath, item.spans[0].start),
        end: project.languageServiceHost.getPositionFromIndex(query.filePath, item.spans[0].start + item.spans[0].length),
        subNodes: item.childItems ? item.childItems.map(ci => navigationBarItemToSemanticTreeNode(ci, project, query)) : []
    };
    return toReturn;
}
function getSemtanticTree(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
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
exports.getSemtanticTree = getSemtanticTree;
function getNavigateToItems(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var languageService = project.languageService;
    let getNodeKind = ts.getNodeKind;
    function getDeclarationName(declaration) {
        let result = getTextOfIdentifierOrLiteral(declaration.name);
        if (result !== undefined) {
            return result;
        }
        if (declaration.name.kind === ts.SyntaxKind.ComputedPropertyName) {
            let expr = declaration.name.expression;
            if (expr.kind === ts.SyntaxKind.PropertyAccessExpression) {
                return expr.name.text;
            }
            return getTextOfIdentifierOrLiteral(expr);
        }
        return undefined;
    }
    function getTextOfIdentifierOrLiteral(node) {
        if (node.kind === ts.SyntaxKind.Identifier ||
            node.kind === ts.SyntaxKind.StringLiteral ||
            node.kind === ts.SyntaxKind.NumericLiteral) {
            return node.text;
        }
        return undefined;
    }
    var items = [];
    for (let file of project.getProjectSourceFiles()) {
        let declarations = file.getNamedDeclarations();
        for (let index in declarations) {
            for (let declaration of declarations[index]) {
                let item = {
                    name: getDeclarationName(declaration),
                    kind: getNodeKind(declaration),
                    filePath: file.fileName,
                    fileName: path.basename(file.fileName),
                    position: project.languageServiceHost.getPositionFromIndex(file.fileName, declaration.getStart())
                };
                items.push(item);
            }
        }
    }
    return resolve({ items });
}
exports.getNavigateToItems = getNavigateToItems;
function getReferences(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var languageService = project.languageService;
    var references = [];
    var refs = languageService.getReferencesAtPosition(query.filePath, query.position) || [];
    references = refs.map(r => {
        var res = project.languageServiceHost.getPositionFromTextSpanWithLinePreview(r.fileName, r.textSpan);
        return { filePath: r.fileName, position: res.position, preview: res.preview };
    });
    return resolve({
        references
    });
}
exports.getReferences = getReferences;
/**
 * Get Completions for external modules + references tags
 */
const getPathCompletions_1 = require("./modules/getPathCompletions");
function filePathWithoutExtension(query) {
    var base = path.basename(query, '.ts');
    return path.dirname(query) + '/' + base;
}
function getRelativePathsInProject(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    return resolve(getPathCompletions_1.getPathCompletions({
        project,
        filePath: query.filePath,
        prefix: query.prefix,
        includeExternalModules: query.includeExternalModules
    }));
}
exports.getRelativePathsInProject = getRelativePathsInProject;
/**
 * Get AST
 */
const astToText_1 = require("./modules/astToText");
function getAST(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var service = project.languageService;
    var files = service.getProgram().getSourceFiles().filter(x => x.fileName == query.filePath);
    if (!files.length)
        resolve({});
    var sourceFile = files[0];
    var root = astToText_1.astToText(sourceFile);
    return resolve({ root });
}
exports.getAST = getAST;
function getASTFull(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var service = project.languageService;
    var files = service.getProgram().getSourceFiles().filter(x => x.fileName == query.filePath);
    if (!files.length)
        resolve({});
    var sourceFile = files[0];
    var root = astToText_1.astToTextFull(sourceFile);
    return resolve({ root });
}
exports.getASTFull = getASTFull;
/**
 * Get Dependencies
 */
const programDependencies_1 = require("./modules/programDependencies");
function getDependencies(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var projectFile = project.projectFile;
    var links = programDependencies_1.default(projectFile, project.languageService.getProgram());
    return resolve({ links });
}
exports.getDependencies = getDependencies;
const qf = require("./fixmyts/quickFix");
const quickFixRegistry_1 = require("./fixmyts/quickFixRegistry");
function getInfoForQuickFixAnalysis(query) {
    projectCache_1.consistentPath(query);
    let project = projectCache_1.getOrCreateProject(query.filePath);
    let program = project.languageService.getProgram();
    let sourceFile = program.getSourceFile(query.filePath);
    let sourceFileText, fileErrors, positionErrors, positionErrorMessages, positionNode;
    if (project.includesSourceFile(query.filePath)) {
        sourceFileText = sourceFile.getFullText();
        fileErrors = getDiagnositcsByFilePath(query);
        let position = query.position;
        positionErrors = getPositionErrors(fileErrors, position);
        if (positionErrors.length === 0 && fileErrors.length !== 0) {
            /** Fall back to file errors */
            position = findClosestErrorPosition(fileErrors, position);
            positionErrors = getPositionErrors(fileErrors, position);
        }
        positionErrorMessages = positionErrors.map(e => ts.flattenDiagnosticMessageText(e.messageText, os.EOL));
        positionNode = ts.getTokenAtPosition(sourceFile, position);
    }
    else {
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
function getPositionErrors(fileErrors, position) {
    /** We want errors that are *touching* and thefore expand the query position by one */
    return fileErrors.filter(e => ((e.start - 1) < position) && (e.start + e.length + 1) > position);
}
function findClosestErrorPosition(fileErrors, position) {
    const newPos = fileErrors
        .map(i => [Math.min(Math.abs(position - i.start), Math.abs(position - i.start - i.length)), i.start])
        .reduce((acc, val) => val[0] < acc[0] || acc[0] === -1 ? val : acc, [-1, -1]);
    return newPos[1] !== -1 ? newPos[1] : position;
}
function getQuickFixes(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    if (!project.includesSourceFile(query.filePath)) {
        return resolve({ fixes: [] });
    }
    var info = getInfoForQuickFixAnalysis(query);
    // And then we let the quickFix determine if it wants provide any fixes for this file
    // And if so we also treat the result as a display string
    var fixes = quickFixRegistry_1.allQuickFixes
        .map(x => {
        var canProvide = x.canProvideFix(info);
        if (!canProvide)
            return;
        else
            return { key: x.key, display: canProvide.display, isNewTextSnippet: canProvide.isNewTextSnippet };
    })
        .filter(x => !!x);
    return resolve({ fixes });
}
exports.getQuickFixes = getQuickFixes;
function applyQuickFix(query) {
    projectCache_1.consistentPath(query);
    var fix = quickFixRegistry_1.allQuickFixes.filter(x => x.key == query.key)[0];
    var info = getInfoForQuickFixAnalysis(query);
    var res = fix.provideFix(info);
    var refactorings = qf.getRefactoringsByFilePath(res);
    return resolve({ refactorings });
}
exports.applyQuickFix = applyQuickFix;
const building_1 = require("./modules/building");
function getOutput(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    return resolve({ output: building_1.getRawOutput(project, query.filePath) });
}
exports.getOutput = getOutput;
function getOutputJs(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var output = building_1.getRawOutput(project, query.filePath);
    var jsFile = output.outputFiles.filter(x => path.extname(x.name) == ".js" || path.extname(x.name) == ".jsx")[0];
    if (!jsFile || output.emitSkipped) {
        return resolve({});
    }
    else {
        return resolve({ jsFilePath: jsFile.name });
    }
}
exports.getOutputJs = getOutputJs;
function getOutputJsStatus(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var output = building_1.getRawOutput(project, query.filePath);
    if (output.emitSkipped) {
        if (output.outputFiles && output.outputFiles.length === 1) {
            if (output.outputFiles[0].text === building.Not_In_Context) {
                return resolve({ emitDiffers: false });
            }
        }
        return resolve({ emitDiffers: true });
    }
    var jsFile = output.outputFiles.filter(x => path.extname(x.name) == ".js")[0];
    if (!jsFile) {
        return resolve({ emitDiffers: false });
    }
    else {
        var emitDiffers = !fs.existsSync(jsFile.name) || fs.readFileSync(jsFile.name).toString() !== jsFile.text;
        return resolve({ emitDiffers });
    }
}
exports.getOutputJsStatus = getOutputJsStatus;
/**
 * Reset all that we know about the file system
 */
function softReset(query) {
    projectCache_1.resetCache(query);
    return resolve({});
}
exports.softReset = softReset;
/**
 * Get rename files refactorings
 */
const moveFiles = require("./modules/moveFiles");
function getRenameFilesRefactorings(query) {
    query.oldPath = fsu.consistentPath(query.oldPath);
    query.newPath = fsu.consistentPath(query.newPath);
    var project = projectCache_1.getOrCreateProject(query.oldPath);
    var res = moveFiles.getRenameFilesRefactorings(project.languageService.getProgram(), query.oldPath, query.newPath);
    var refactorings = qf.getRefactoringsByFilePath(res);
    return resolve({ refactorings });
}
exports.getRenameFilesRefactorings = getRenameFilesRefactorings;
function createProject(query) {
    projectCache_1.consistentPath(query);
    var projectFile = tsconfig.createProjectRootSync(query.filePath);
    projectCache_1.queryParent.setConfigurationError({ projectFilePath: query.filePath, error: null });
    return resolve({ createdFilePath: projectFile.projectFilePath });
}
exports.createProject = createProject;
function toggleBreakpoint(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    // Get the node at the current location.
    let program = project.languageService.getProgram();
    let sourceFile = program.getSourceFile(query.filePath);
    let sourceFileText = sourceFile.getFullText();
    let positionNode = ts.getTokenAtPosition(sourceFile, query.position);
    let refactoring;
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
        };
    }
    else {
        let toInsert = 'debugger;';
        refactoring = {
            filePath: query.filePath,
            span: {
                start: positionNode.getFullStart(),
                length: 0
            },
            newText: toInsert
        };
    }
    var refactorings = qf.getRefactoringsByFilePath(refactoring ? [refactoring] : []);
    return resolve({ refactorings });
}
exports.toggleBreakpoint = toggleBreakpoint;
