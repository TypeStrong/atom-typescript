var path = require('path');
var fuzzaldrin = require('fuzzaldrin');
var utils = require('./utils');
var resolve = Promise.resolve.bind(Promise);
var projectCache_1 = require("./projectCache");
function textSpan(span) {
    return {
        start: span.start,
        length: span.length
    };
}
function echo(data) {
    return projectCache_1.queryParent.echoNumWithModification({ num: data.num }).then(function (resp) {
        data.num = resp.num;
        return data;
    });
}
exports.echo = echo;
function quickInfo(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
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
    projectCache_1.consistentPath(query);
    var proj = projectCache_1.getOrCreateProject(query.filePath);
    var totalCount = proj.projectFile.project.files.length;
    var builtCount = 0;
    var errorCount = 0;
    var outputs = proj.projectFile.project.files.map(function (filePath) {
        var output = building.emitFile(proj, filePath);
        builtCount++;
        errorCount = errorCount + output.errors.length;
        projectCache_1.queryParent.buildUpdate({
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
    projectCache_1.consistentPath(query);
    var fileName = path.basename(query.filePath);
    return errorsForFile({ filePath: query.filePath })
        .then(function (resp) {
        return { errors: resp.errors.filter(function (error) { return path.basename(error.filePath) == fileName; }) };
    });
}
exports.errorsForFileFiltered = errorsForFileFiltered;
function getCompletionsAtPosition(query) {
    projectCache_1.consistentPath(query);
    var filePath = query.filePath, position = query.position, prefix = query.prefix;
    var project = projectCache_1.getOrCreateProject(filePath);
    var completions = project.languageService.getCompletionsAtPosition(filePath, position);
    var completionList = completions ? completions.entries.filter(function (x) { return !!x; }) : [];
    var endsInPunctuation = utils.prefixEndsInPunctuation(prefix);
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
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var signatureHelpItems = project.languageService.getSignatureHelpItems(query.filePath, query.position);
    if (!signatureHelpItems || !signatureHelpItems.items || !signatureHelpItems.items.length)
        return resolve({ signatureHelps: [] });
    return signatureHelpItems.items;
}
exports.getSignatureHelps = getSignatureHelps;
function emitFile(query) {
    projectCache_1.consistentPath(query);
    return resolve(building.emitFile(projectCache_1.getOrCreateProject(query.filePath), query.filePath));
}
exports.emitFile = emitFile;
var formatting = require('./modules/formatting');
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
    projectCache_1.consistentPath(query);
    projectCache_1.getOrCreateProject(query.filePath).languageServiceHost.updateScript(query.filePath, query.text);
    return resolve({});
}
exports.updateText = updateText;
function editText(query) {
    projectCache_1.consistentPath(query);
    projectCache_1.getOrCreateProject(query.filePath).languageServiceHost.editScript(query.filePath, query.minChar, query.limChar, query.newText);
    return resolve({});
}
exports.editText = editText;
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
    return resolve({ errors: getDiagnositcsByFilePath(query).map(building.diagnosticToTSError) });
}
exports.errorsForFile = errorsForFile;
function getRenameInfo(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
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
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var indent = project.languageService.getIndentationAtPosition(query.filePath, query.position, project.projectFile.project.formatCodeOptions);
    return resolve({ indent: indent });
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
    items.sort(function (a, b) { return a.spans[0].start - b.spans[0].start; });
    for (var _i = 0; _i < items.length; _i++) {
        var item = items[_i];
        if (item.childItems) {
            sortNavbarItemsBySpan(item.childItems);
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
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
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
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var languageService = project.languageService;
    var getNodeKind = ts.getNodeKind;
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
            return getTextOfIdentifierOrLiteral(expr);
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
        var declarations = file.getNamedDeclarations();
        for (var index in declarations) {
            for (var _b = 0, _c = declarations[index]; _b < _c.length; _b++) {
                var declaration = _c[_b];
                var item = {
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
    return resolve({ items: items });
}
exports.getNavigateToItems = getNavigateToItems;
function getReferences(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
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
var getPathCompletions_1 = require("./modules/getPathCompletions");
function filePathWithoutExtension(query) {
    var base = path.basename(query, '.ts');
    return path.dirname(query) + '/' + base;
}
function getRelativePathsInProject(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    return resolve(getPathCompletions_1.getPathCompletions({
        project: project,
        filePath: query.filePath,
        prefix: query.prefix,
        includeExternalModules: query.includeExternalModules
    }));
}
exports.getRelativePathsInProject = getRelativePathsInProject;
var astToText_1 = require("./modules/astToText");
function getAST(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
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
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
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
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var projectFile = project.projectFile;
    var links = programDependencies_1.default(projectFile, project.languageService.getProgram());
    return resolve({ links: links });
}
exports.getDependencies = getDependencies;
var qf = require("./fixmyts/quickFix");
var quickFixRegistry_1 = require("./fixmyts/quickFixRegistry");
function getInfoForQuickFixAnalysis(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
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
    projectCache_1.consistentPath(query);
    var info = getInfoForQuickFixAnalysis(query);
    var fixes = quickFixRegistry_1.allQuickFixes.map(function (x) { return { key: x.key, display: x.canProvideFix(info) }; }).filter(function (x) { return !!x.display; });
    return resolve({ fixes: fixes });
}
exports.getQuickFixes = getQuickFixes;
function applyQuickFix(query) {
    projectCache_1.consistentPath(query);
    var fix = quickFixRegistry_1.allQuickFixes.filter(function (x) { return x.key == query.key; })[0];
    var info = getInfoForQuickFixAnalysis(query);
    var res = fix.provideFix(info);
    var refactorings = qf.getRefactoringsByFilePath(res);
    return resolve({ refactorings: refactorings });
}
exports.applyQuickFix = applyQuickFix;
var building_1 = require("./modules/building");
function getOutput(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    return resolve({ output: building_1.getRawOutput(project, query.filePath) });
}
exports.getOutput = getOutput;
function softReset(query) {
    projectCache_1.resetCache(query);
    return resolve({});
}
exports.softReset = softReset;
