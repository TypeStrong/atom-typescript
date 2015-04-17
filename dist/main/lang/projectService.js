///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated
var fs = require('fs');
var path = require('path');
var ts = require('typescript');
var fuzzaldrin = require('fuzzaldrin');
var tsconfig = require('../tsconfig/tsconfig');
var utils = require('./utils');
var project = require('./core/project');
var Project = project.Project;
var languageServiceHost = project.languageServiceHost;
var resolve = Promise.resolve.bind(Promise);
var queryParent = require('../../worker/queryParent');
var child;
function fixChild(childInjected) {
    child = childInjected;
    queryParent.echoNumWithModification = child.sendToIpc(queryParent.echoNumWithModification);
    queryParent.getUpdatedTextForUnsavedEditors = child.sendToIpc(queryParent.getUpdatedTextForUnsavedEditors);
    queryParent.getOpenEditorPaths = child.sendToIpc(queryParent.getOpenEditorPaths);
    queryParent.setConfigurationError = child.sendToIpc(queryParent.setConfigurationError);
    queryParent.notifySuccess = child.sendToIpc(queryParent.notifySuccess);
    queryParent.buildUpdate = child.sendToIpc(queryParent.buildUpdate);
}
exports.fixChild = fixChild;
var projectByProjectFilePath = {};
var projectByFilePath = {};
var watchingProjectFile = {};
function watchProjectFileIfNotDoingItAlready(projectFilePath) {
    if (!fs.existsSync(projectFilePath)) {
        return;
    }
    if (watchingProjectFile[projectFilePath])
        return;
    watchingProjectFile[projectFilePath] = true;
    fs.watch(projectFilePath, { persistent: false, recursive: false }, function () {
        if (!fs.existsSync(projectFilePath)) {
            var project = projectByProjectFilePath[projectFilePath];
            if (project) {
                var files = project.projectFile.project.files;
                delete projectByProjectFilePath[projectFilePath];
                files.forEach(function (file) { return delete projectByFilePath[file]; });
            }
            return;
        }
        try {
            var projectFile = getOrCreateProjectFile(projectFilePath);
            cacheAndCreateProject(projectFile);
            queryParent.setConfigurationError({ projectFilePath: projectFile.projectFilePath, error: null });
        }
        catch (ex) {
        }
    });
}
var chokidar = require('chokidar');
var watchingTheFilesInTheProject = {};
function watchTheFilesInTheProjectIfNotDoingItAlready(projectFile) {
    var projectFilePath = projectFile.projectFilePath;
    if (!fs.existsSync(projectFilePath)) {
        return;
    }
    if (watchingTheFilesInTheProject[projectFilePath])
        return;
    watchingTheFilesInTheProject[projectFilePath] = true;
    var watcher = chokidar.watch(projectFile.project.files || projectFile.project.filesGlob);
    watcher.on('add', function () {
    });
    watcher.on('unlink', function (filePath) {
    });
    watcher.on('change', function (filePath) {
        filePath = tsconfig.consistentPath(filePath);
        queryParent.getOpenEditorPaths({}).then(function (res) {
            var openPaths = res.filePaths;
            if (openPaths.some(function (x) { return x == filePath; })) {
                return;
            }
            var project = projectByFilePath[filePath];
            if (!project) {
                return;
            }
            var contents = fs.readFileSync(filePath).toString();
            project.languageServiceHost.updateScript(filePath, contents);
        });
    });
}
function cacheAndCreateProject(projectFile) {
    var project = projectByProjectFilePath[projectFile.projectFilePath] = new Project(projectFile);
    projectFile.project.files.forEach(function (file) { return projectByFilePath[file] = project; });
    queryParent.getUpdatedTextForUnsavedEditors({})
        .then(function (resp) {
        resp.editors.forEach(function (e) {
            consistentPath(e);
            project.languageServiceHost.updateScript(e.filePath, e.text);
        });
    });
    watchProjectFileIfNotDoingItAlready(projectFile.projectFilePath);
    watchTheFilesInTheProjectIfNotDoingItAlready(projectFile);
    return project;
}
function getOrCreateProjectFile(filePath) {
    try {
        if (path.dirname(filePath) == languageServiceHost.typescriptDirectory) {
            return tsconfig.getDefaultProject(filePath);
        }
        var projectFile = tsconfig.getProjectSync(filePath);
        queryParent.setConfigurationError({ projectFilePath: projectFile.projectFilePath, error: null });
        return projectFile;
    }
    catch (ex) {
        var err = ex;
        if (err.message === tsconfig.errors.GET_PROJECT_NO_PROJECT_FOUND) {
            if (tsconfig.endsWith(filePath.toLowerCase(), '.d.ts')) {
                return tsconfig.getDefaultProject(filePath);
            }
            else {
                var projectFile = tsconfig.createProjectRootSync(filePath);
                queryParent.notifySuccess({ message: 'AtomTS: tsconfig.json file created: <br/>' + projectFile.projectFilePath });
                queryParent.setConfigurationError({ projectFilePath: projectFile.projectFilePath, error: null });
                return projectFile;
            }
        }
        else {
            if (ex.message === tsconfig.errors.GET_PROJECT_JSON_PARSE_FAILED) {
                var details0 = ex.details;
                queryParent.setConfigurationError({
                    projectFilePath: details0.projectFilePath,
                    error: {
                        message: ex.message,
                        details: ex.details
                    }
                });
                watchProjectFileIfNotDoingItAlready(details0.projectFilePath);
            }
            if (ex.message === tsconfig.errors.GET_PROJECT_PROJECT_FILE_INVALID_OPTIONS) {
                var details1 = ex.details;
                queryParent.setConfigurationError({
                    projectFilePath: details1.projectFilePath,
                    error: {
                        message: ex.message,
                        details: ex.details
                    }
                });
                watchProjectFileIfNotDoingItAlready(details1.projectFilePath);
            }
            if (ex.message === tsconfig.errors.GET_PROJECT_GLOB_EXPAND_FAILED) {
                var details2 = ex.details;
                queryParent.setConfigurationError({
                    projectFilePath: details2.projectFilePath,
                    error: {
                        message: ex.message,
                        details: ex.details
                    }
                });
                watchProjectFileIfNotDoingItAlready(details2.projectFilePath);
            }
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
        var project = cacheAndCreateProject(projectFile);
        return project;
    }
}
function textSpan(span) {
    return {
        start: span.start,
        length: span.length
    };
}
function consistentPath(query) {
    if (!query.filePath)
        return;
    query.filePath = tsconfig.consistentPath(query.filePath);
}
function echo(data) {
    return queryParent.echoNumWithModification({ num: data.num }).then(function (resp) {
        data.num = resp.num;
        return data;
    });
}
exports.echo = echo;
function quickInfo(query) {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var info = project.languageService.getQuickInfoAtPosition(query.filePath, query.position);
    if (!info)
        return Promise.resolve({ valid: false });
    else
        return resolve({
            valid: true,
            name: ts.displayPartsToString(info.displayParts || []),
            comment: ts.displayPartsToString(info.documentation || []),
        });
}
exports.quickInfo = quickInfo;
var building = require('./modules/building');
function build(query) {
    consistentPath(query);
    var proj = getOrCreateProject(query.filePath);
    var totalCount = proj.projectFile.project.files.length;
    var builtCount = 0;
    var errorCount = 0;
    var outputs = proj.projectFile.project.files.map(function (filePath) {
        var output = building.emitFile(proj, filePath);
        builtCount++;
        errorCount = errorCount + output.errors.length;
        queryParent.buildUpdate({
            totalCount: totalCount,
            builtCount: builtCount,
            errorCount: errorCount,
            firstError: errorCount && !(errorCount - output.errors.length),
            filePath: filePath,
            errorsInFile: output.errors
        });
        return output;
    });
    return resolve({
        buildOutput: {
            outputs: outputs,
            counts: {
                inputFiles: proj.projectFile.project.files.length,
                outputFiles: utils.selectMany(outputs.map(function (out) { return out.outputFiles; })).length,
                errors: errorCount,
                emitErrors: outputs.filter(function (out) { return out.emitError; }).length
            }
        }
    });
}
exports.build = build;
function errorsForFileFiltered(query) {
    consistentPath(query);
    var fileName = path.basename(query.filePath);
    return errorsForFile({ filePath: query.filePath })
        .then(function (resp) {
        return { errors: resp.errors.filter(function (error) { return path.basename(error.filePath) == fileName; }) };
    });
}
exports.errorsForFileFiltered = errorsForFileFiltered;
var punctuations = utils.createMap([';', '{', '}', '(', ')', '.', ':', '<', '>', "'", '"']);
var prefixEndsInPunctuation = function (prefix) { return prefix.length && prefix.trim().length && punctuations[prefix.trim()[prefix.trim().length - 1]]; };
function getCompletionsAtPosition(query) {
    consistentPath(query);
    var filePath = query.filePath, position = query.position, prefix = query.prefix;
    var project = getOrCreateProject(filePath);
    var completions = project.languageService.getCompletionsAtPosition(filePath, position);
    var completionList = completions ? completions.entries.filter(function (x) { return !!x; }) : [];
    var endsInPunctuation = prefixEndsInPunctuation(prefix);
    if (prefix.length && !endsInPunctuation) {
        completionList = fuzzaldrin.filter(completionList, prefix, { key: 'name' });
    }
    var maxSuggestions = 50;
    var maxDocComments = 10;
    if (completionList.length > maxSuggestions)
        completionList = completionList.slice(0, maxSuggestions);
    function docComment(c) {
        var completionDetails = project.languageService.getCompletionEntryDetails(filePath, position, c.name);
        var display;
        if (c.kind == "method" || c.kind == "function" || c.kind == "property") {
            var parts = completionDetails.displayParts || [];
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
    var completionsToReturn = completionList.map(function (c, index) {
        if (index < maxDocComments) {
            var details = docComment(c);
        }
        else {
            details = {
                display: c.kind,
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
            signatures.items.forEach(function (item) {
                var snippet = item.parameters.map(function (p, i) {
                    var display = '${' + (i + 1) + ':' + ts.displayPartsToString(p.displayParts) + '}';
                    if (i === signatures.argumentIndex) {
                        return display;
                    }
                    return display;
                }).join(ts.displayPartsToString(item.separatorDisplayParts));
                var label = ts.displayPartsToString(item.prefixDisplayParts)
                    + snippet
                    + ts.displayPartsToString(item.suffixDisplayParts);
                completionsToReturn.unshift({ snippet: snippet });
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
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var signatureHelpItems = project.languageService.getSignatureHelpItems(query.filePath, query.position);
    if (!signatureHelpItems || !signatureHelpItems.items || !signatureHelpItems.items.length)
        return resolve({ signatureHelps: [] });
    return signatureHelpItems.items;
}
exports.getSignatureHelps = getSignatureHelps;
function emitFile(query) {
    consistentPath(query);
    return resolve(building.emitFile(getOrCreateProject(query.filePath), query.filePath));
}
exports.emitFile = emitFile;
var formatting = require('./modules/formatting');
function formatDocument(query) {
    consistentPath(query);
    var proj = getOrCreateProject(query.filePath);
    return resolve({ edits: formatting.formatDocument(proj, query.filePath) });
}
exports.formatDocument = formatDocument;
function formatDocumentRange(query) {
    consistentPath(query);
    var proj = getOrCreateProject(query.filePath);
    return resolve({ edits: formatting.formatDocumentRange(proj, query.filePath, query.start, query.end) });
}
exports.formatDocumentRange = formatDocumentRange;
function getDefinitionsAtPosition(query) {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var definitions = project.languageService.getDefinitionAtPosition(query.filePath, query.position);
    var projectFileDirectory = project.projectFile.projectFileDirectory;
    if (!definitions || !definitions.length)
        return resolve({ projectFileDirectory: projectFileDirectory, definitions: [] });
    return resolve({
        projectFileDirectory: projectFileDirectory,
        definitions: definitions.map(function (d) {
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
    consistentPath(query);
    getOrCreateProject(query.filePath).languageServiceHost.updateScript(query.filePath, query.text);
    return resolve({});
}
exports.updateText = updateText;
function editText(query) {
    consistentPath(query);
    getOrCreateProject(query.filePath).languageServiceHost.editScript(query.filePath, query.minChar, query.limChar, query.newText);
    return resolve({});
}
exports.editText = editText;
function getDiagnositcsByFilePath(query) {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var diagnostics = project.languageService.getSyntacticDiagnostics(query.filePath);
    if (diagnostics.length === 0) {
        diagnostics = project.languageService.getSemanticDiagnostics(query.filePath);
    }
    return diagnostics;
}
function errorsForFile(query) {
    consistentPath(query);
    return resolve({ errors: getDiagnositcsByFilePath(query).map(building.diagnosticToTSError) });
}
exports.errorsForFile = errorsForFile;
function getRenameInfo(query) {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var findInStrings = false, findInComments = false;
    var info = project.languageService.getRenameInfo(query.filePath, query.position);
    if (info && info.canRename) {
        var locations = {};
        project.languageService.findRenameLocations(query.filePath, query.position, findInStrings, findInComments)
            .forEach(function (loc) {
            if (!locations[loc.fileName])
                locations[loc.fileName] = [];
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
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var indent = project.languageService.getIndentationAtPosition(query.filePath, query.position, project.projectFile.project.formatCodeOptions);
    return resolve({ indent: indent });
}
exports.getIndentationAtPosition = getIndentationAtPosition;
function debugLanguageServiceHostVersion(query) {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    return resolve({ text: project.languageServiceHost.getScriptContent(query.filePath) });
}
exports.debugLanguageServiceHostVersion = debugLanguageServiceHostVersion;
function getProjectFileDetails(query) {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    return resolve(project.projectFile);
}
exports.getProjectFileDetails = getProjectFileDetails;
function sortNavbarItemsBySpan(items) {
    items.sort(function (a, b) { return a.spans[0].start - b.spans[0].start; });
    for (var _i = 0; _i < items.length; _i++) {
        var item_1 = items[_i];
        if (item_1.childItems) {
            sortNavbarItemsBySpan(item_1.childItems);
        }
    }
}
function flattenNavBarItems(items) {
    var toreturn = [];
    function keepAdding(item, depth) {
        item.indent = depth;
        var children = item.childItems;
        delete item.childItems;
        toreturn.push(item);
        if (children) {
            children.forEach(function (child) { return keepAdding(child, depth + 1); });
        }
    }
    items.forEach(function (item) { return keepAdding(item, 0); });
    return toreturn;
}
function getNavigationBarItems(query) {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var languageService = project.languageService;
    var navBarItems = languageService.getNavigationBarItems(query.filePath);
    if (navBarItems.length && navBarItems[0].text == "<global>") {
        navBarItems.shift();
    }
    sortNavbarItemsBySpan(navBarItems);
    navBarItems = flattenNavBarItems(navBarItems);
    var items = navBarItems.map(function (item) {
        item.position = project.languageServiceHost.getPositionFromIndex(query.filePath, item.spans[0].start);
        delete item.spans;
        return item;
    });
    return resolve({ items: items });
}
exports.getNavigationBarItems = getNavigationBarItems;
function getNavigateToItems(query) {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var languageService = project.languageService;
    var ts2 = ts;
    var getNodeKind = ts2.getNodeKind;
    function getDeclarationName(declaration) {
        var result = getTextOfIdentifierOrLiteral(declaration.name);
        if (result !== undefined) {
            return result;
        }
        if (declaration.name.kind === 127) {
            var expr = declaration.name.expression;
            if (expr.kind === 155) {
                return expr.name.text;
            }
            return ts2.getTextOfIdentifierOrLiteral(expr);
        }
        return undefined;
    }
    function getTextOfIdentifierOrLiteral(node) {
        if (node.kind === 65 ||
            node.kind === 8 ||
            node.kind === 7) {
            return node.text;
        }
        return undefined;
    }
    var items = [];
    for (var _i = 0, _a = project.getProjectSourceFiles(); _i < _a.length; _i++) {
        var file = _a[_i];
        for (var _b = 0, _c = file.getNamedDeclarations(); _b < _c.length; _b++) {
            var declaration = _c[_b];
            var item_2 = {
                name: getDeclarationName(declaration),
                kind: getNodeKind(declaration),
                filePath: file.fileName,
                fileName: path.basename(file.fileName),
                position: project.languageServiceHost.getPositionFromIndex(file.fileName, declaration.getStart())
            };
            items.push(item_2);
        }
    }
    return resolve({ items: items });
}
exports.getNavigateToItems = getNavigateToItems;
function getReferences(query) {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var languageService = project.languageService;
    var references = [];
    var refs = languageService.getReferencesAtPosition(query.filePath, query.position) || [];
    references = refs.map(function (r) {
        var res = project.languageServiceHost.getPositionFromTextSpanWithLinePreview(r.fileName, r.textSpan);
        return { filePath: r.fileName, position: res.position, preview: res.preview };
    });
    return resolve({
        references: references
    });
}
exports.getReferences = getReferences;
var getExternalModules_1 = require("./modules/getExternalModules");
function filePathWithoutExtension(query) {
    var base = path.basename(query, '.ts');
    return path.dirname(query) + '/' + base;
}
function getRelativePathsInProject(query) {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var sourceDir = path.dirname(query.filePath);
    var filePaths = project.projectFile.project.files.filter(function (p) { return p !== query.filePath; });
    var files = filePaths.map(function (p) {
        return {
            name: path.basename(p, '.ts'),
            relativePath: tsconfig.removeExt(tsconfig.makeRelativePath(sourceDir, p)),
            fullPath: p
        };
    });
    if (query.includeExternalModules) {
        var externalModules = getExternalModules_1.getExternalModuleNames(project.languageService.getProgram());
        externalModules.forEach(function (e) { return files.push({
            name: "module \"" + e + "\"",
            relativePath: e,
            fullPath: e
        }); });
    }
    var endsInPunctuation = prefixEndsInPunctuation(query.prefix);
    if (!endsInPunctuation)
        files = fuzzaldrin.filter(files, query.prefix, { key: 'name' });
    var response = {
        files: files,
        endsInPunctuation: endsInPunctuation
    };
    return resolve(response);
}
exports.getRelativePathsInProject = getRelativePathsInProject;
var astToText_1 = require("./modules/astToText");
function getAST(query) {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var service = project.languageService;
    var files = service.getProgram().getSourceFiles().filter(function (x) { return x.fileName == query.filePath; });
    if (!files.length)
        resolve({});
    var sourceFile = files[0];
    var root = astToText_1.astToText(sourceFile);
    return resolve({ root: root });
}
exports.getAST = getAST;
function getASTFull(query) {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var service = project.languageService;
    var files = service.getProgram().getSourceFiles().filter(function (x) { return x.fileName == query.filePath; });
    if (!files.length)
        resolve({});
    var sourceFile = files[0];
    var root = astToText_1.astToTextFull(sourceFile);
    return resolve({ root: root });
}
exports.getASTFull = getASTFull;
var programDependencies_1 = require("./modules/programDependencies");
function getDependencies(query) {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var projectFile = project.projectFile;
    var links = programDependencies_1.default(projectFile, project.languageService.getProgram());
    return resolve({ links: links });
}
exports.getDependencies = getDependencies;
var qf = require("./fixmyts/quickFix");
var addClassMember_1 = require("./fixmyts/addClassMember");
var equalsToEquals_1 = require("./fixmyts/equalsToEquals");
var quotesToQuotes_1 = require("./fixmyts/quotesToQuotes");
var quoteToTemplate_1 = require("./fixmyts/quoteToTemplate");
var allQuickFixes = [
    new addClassMember_1.default(),
    new equalsToEquals_1.default(),
    new quotesToQuotes_1.default(),
    new quoteToTemplate_1.default(),
];
function getInfoForQuickFixAnalysis(query) {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var program = project.languageService.getProgram();
    var srcFile = program.getSourceFile(query.filePath);
    var fileErrors = getDiagnositcsByFilePath(query);
    var positionErrors = fileErrors.filter(function (e) { return (e.start < query.position) && (e.start + e.length) > query.position; });
    var positionNode = ts.getTokenAtPosition(srcFile, query.position);
    var service = project.languageService;
    var typeChecker = program.getTypeChecker();
    return {
        project: project,
        program: program,
        srcFile: srcFile,
        fileErrors: fileErrors,
        positionErrors: positionErrors,
        position: query.position,
        positionNode: positionNode,
        service: service,
        typeChecker: typeChecker,
        filePath: srcFile.fileName
    };
}
function getQuickFixes(query) {
    consistentPath(query);
    var info = getInfoForQuickFixAnalysis(query);
    var fixes = allQuickFixes.map(function (x) { return { key: x.key, display: x.canProvideFix(info) }; }).filter(function (x) { return !!x.display; });
    return resolve({ fixes: fixes });
}
exports.getQuickFixes = getQuickFixes;
function applyQuickFix(query) {
    consistentPath(query);
    var fix = allQuickFixes.filter(function (x) { return x.key == query.key; })[0];
    var info = getInfoForQuickFixAnalysis(query);
    var res = fix.provideFix(info);
    var refactorings = qf.getRefactoringsByFilePath(res);
    return resolve({ refactorings: refactorings });
}
exports.applyQuickFix = applyQuickFix;
