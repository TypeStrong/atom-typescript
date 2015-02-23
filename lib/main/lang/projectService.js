var path = require('path');
var ts = require('typescript');
var fuzzaldrin = require('fuzzaldrin');
var tsconfig = require('../tsconfig/tsconfig');
var utils = require('./utils');
var project = require('./project');
var Project = project.Project;
var projectByProjectPath = {};
var projectByFilePath = {};
function cacheAndCreateProject(projectFile) {
    var project = projectByProjectPath[projectFile.projectFileDirectory] = new Project(projectFile);
    projectFile.project.files.forEach(function (file) { return projectByFilePath[file] = project; });
    return project;
}
function getOrCreateProjectFile(filePath) {
    try {
        var projectFile = tsconfig.getProjectSync(filePath);
        return projectFile;
    }
    catch (ex) {
        var err = ex;
        if (err.message === tsconfig.errors.GET_PROJECT_NO_PROJECT_FOUND) {
            var projectFile = tsconfig.createProjectRootSync(filePath);
            return projectFile;
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
        var project = cacheAndCreateProject(projectFile);
        return project;
    }
}
function textSpan(span) {
    return {
        start: span.start(),
        length: span.length()
    };
}
function echo(data) {
    return data;
}
exports.echo = echo;
function quickInfo(query) {
    var project = getOrCreateProject(query.filePath);
    var info = project.languageService.getQuickInfoAtPosition(query.filePath, query.position);
    if (!info)
        return { valid: false };
    else
        return {
            valid: true,
            name: ts.displayPartsToString(info.displayParts || []),
            comment: ts.displayPartsToString(info.documentation || []),
        };
}
exports.quickInfo = quickInfo;
function build(query) {
    return {
        outputs: getOrCreateProject(query.filePath).build()
    };
}
exports.build = build;
function errorsForFileFiltered(query) {
    var fileName = path.basename(query.filePath);
    return { errors: errorsForFile({ filePath: query.filePath }).errors.filter(function (error) { return path.basename(error.filePath) == fileName; }) };
}
exports.errorsForFileFiltered = errorsForFileFiltered;
var punctuations = utils.createMap([';', '{', '}', '(', ')', '.', ':', '<', '>']);
function getCompletionsAtPosition(query) {
    var filePath = query.filePath, position = query.position, prefix = query.prefix;
    var project = getOrCreateProject(filePath);
    var completions = project.languageService.getCompletionsAtPosition(filePath, position);
    var completionList = completions ? completions.entries.filter(function (x) { return !!x; }) : [];
    var endsInPunctuation = prefix.length && prefix.trim().length && punctuations[prefix.trim()[prefix.trim().length - 1]];
    if (prefix.length && !endsInPunctuation) {
        completionList = fuzzaldrin.filter(completionList, prefix, { key: 'name' });
    }
    if (completionList.length > query.maxSuggestions)
        completionList = completionList.slice(0, query.maxSuggestions);
    function docComment(c) {
        var completionDetails = project.languageService.getCompletionEntryDetails(filePath, position, c.name);
        var display;
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
        completions: completionList.map(function (c) {
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
exports.getCompletionsAtPosition = getCompletionsAtPosition;
function getSignatureHelps(query) {
    var project = getOrCreateProject(query.filePath);
    var signatureHelpItems = project.languageService.getSignatureHelpItems(query.filePath, query.position);
    if (!signatureHelpItems || !signatureHelpItems.items || !signatureHelpItems.items.length)
        return { signatureHelps: [] };
    return signatureHelpItems.items;
}
exports.getSignatureHelps = getSignatureHelps;
function emitFile(query) {
    return getOrCreateProject(query.filePath).emitFile(query.filePath);
}
exports.emitFile = emitFile;
function regenerateProjectGlob(query) {
    var projectFile = getOrCreateProjectFile(query.filePath);
    cacheAndCreateProject(projectFile);
    return {};
}
exports.regenerateProjectGlob = regenerateProjectGlob;
function formatDocument(query) {
    var prog = getOrCreateProject(query.filePath);
    return prog.formatDocument(query.filePath, query.cursor);
}
exports.formatDocument = formatDocument;
function formatDocumentRange(query) {
    var prog = getOrCreateProject(query.filePath);
    return { formatted: prog.formatDocumentRange(query.filePath, query.start, query.end) };
}
exports.formatDocumentRange = formatDocumentRange;
function getDefinitionsAtPosition(query) {
    var project = getOrCreateProject(query.filePath);
    var definitions = project.languageService.getDefinitionAtPosition(query.filePath, query.position);
    var projectFileDirectory = project.projectFile.projectFileDirectory;
    if (!definitions || !definitions.length)
        return { projectFileDirectory: projectFileDirectory, definitions: [] };
    return {
        projectFileDirectory: projectFileDirectory,
        definitions: definitions.map(function (d) {
            var pos = project.languageServiceHost.getPositionFromIndex(d.fileName, d.textSpan.start());
            return {
                filePath: d.fileName,
                position: pos
            };
        })
    };
}
exports.getDefinitionsAtPosition = getDefinitionsAtPosition;
function updateText(query) {
    getOrCreateProject(query.filePath).languageServiceHost.updateScript(query.filePath, query.text);
    return {};
}
exports.updateText = updateText;
function errorsForFile(query) {
    var program = getOrCreateProject(query.filePath);
    var diagnostics = program.languageService.getSyntacticDiagnostics(query.filePath);
    if (diagnostics.length === 0) {
        diagnostics = program.languageService.getSemanticDiagnostics(query.filePath);
    }
    return { errors: diagnostics.map(project.diagnosticToTSError) };
}
exports.errorsForFile = errorsForFile;
function getRenameInfo(query) {
    var project = getOrCreateProject(query.filePath);
    var findInStrings = false, findInComments = false;
    var info = project.languageService.getRenameInfo(query.filePath, query.position);
    if (info && info.canRename) {
        var locations = project.languageService.findRenameLocations(query.filePath, query.position, findInStrings, findInComments).map(function (loc) {
            return {
                textSpan: textSpan(loc.textSpan),
                filePath: loc.fileName
            };
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
        };
    }
    else {
        return {
            canRename: false
        };
    }
}
exports.getRenameInfo = getRenameInfo;
