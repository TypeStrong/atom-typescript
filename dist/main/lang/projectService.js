"use strict";
var path = require("path");
var tsconfig = require("../tsconfig/tsconfig");
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
function getSignatureHelps(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var signatureHelpItems = project.languageService.getSignatureHelpItems(query.filePath, query.position);
    if (!signatureHelpItems || !signatureHelpItems.items || !signatureHelpItems.items.length)
        return resolve({ signatureHelps: [] });
    return signatureHelpItems.items;
}
exports.getSignatureHelps = getSignatureHelps;
var formatting = require("./modules/formatting");
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
    for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
        var item = items_1[_i];
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
function navigationBarItemToSemanticTreeNode(item, project, query) {
    var toReturn = {
        text: item.text,
        kind: item.kind,
        kindModifiers: item.kindModifiers,
        start: project.languageServiceHost.getPositionFromIndex(query.filePath, item.spans[0].start),
        end: project.languageServiceHost.getPositionFromIndex(query.filePath, item.spans[0].start + item.spans[0].length),
        subNodes: item.childItems ? item.childItems.map(function (ci) { return navigationBarItemToSemanticTreeNode(ci, project, query); }) : []
    };
    return toReturn;
}
function getSemtanticTree(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var navBarItems = project.languageService.getNavigationBarItems(query.filePath);
    if (navBarItems.length && navBarItems[0].text == "<global>") {
        navBarItems.shift();
    }
    sortNavbarItemsBySpan(navBarItems);
    var nodes = navBarItems.map(function (nbi) { return navigationBarItemToSemanticTreeNode(nbi, project, query); });
    return resolve({ nodes: nodes });
}
exports.getSemtanticTree = getSemtanticTree;
function getNavigateToItems(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var getNodeKind = ts.getNodeKind;
    function getDeclarationName(declaration) {
        var result = getTextOfIdentifierOrLiteral(declaration.name);
        if (result !== undefined) {
            return result;
        }
        if (declaration.name.kind === ts.SyntaxKind.ComputedPropertyName) {
            var expr = declaration.name.expression;
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
function createProject(query) {
    projectCache_1.consistentPath(query);
    var projectFile = tsconfig.createProjectRootSync(query.filePath);
    projectCache_1.queryParent.setConfigurationError({ projectFilePath: query.filePath, error: null });
    return resolve({ createdFilePath: projectFile.projectFilePath });
}
exports.createProject = createProject;
