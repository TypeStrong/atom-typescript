var path = require('path');
var ts = require('typescript');
var fuzzaldrin = require('fuzzaldrin');
var tsconfig = require('../tsconfig/tsconfig');
var project = require('./project');
var Project = project.Project;
var programByProjectPath = {};
var programByFilePath = {};
function getOrCreateProjectFile(filePath) {
    try {
        var projectFile = tsconfig.getProjectSync(filePath);
        return projectFile;
    }
    catch (ex) {
        var err = ex;
        if (err.message === tsconfig.errors.GET_PROJECT_INVALID_PROJECT_FILE) {
            throw ex;
        }
        else {
            return tsconfig.createProjectRootSync(filePath);
        }
    }
}
function getOrCreateProject(filePath) {
    filePath = tsconfig.consistentPath(filePath);
    if (programByFilePath[filePath]) {
        return programByFilePath[filePath];
    }
    else {
        var projectFile = getOrCreateProjectFile(filePath);
        if (programByProjectPath[projectFile.projectFileDirectory]) {
            return programByFilePath[filePath] = programByProjectPath[projectFile.projectFileDirectory];
        }
        else {
            var program = programByProjectPath[projectFile.projectFileDirectory] = new Project(projectFile);
            projectFile.project.files.forEach(function (file) { return programByFilePath[file] = program; });
            return program;
        }
    }
}
function echo(data) {
    return data;
}
exports.echo = echo;
function quickInfo(query) {
    var program = getOrCreateProject(query.filePath);
    var info = program.languageService.getQuickInfoAtPosition(query.filePath, query.position);
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
function getCompletionsAtPosition(query) {
    var filePath = query.filePath, position = query.position, prefix = query.prefix;
    var program = getOrCreateProject(filePath);
    var completions = program.languageService.getCompletionsAtPosition(filePath, position);
    var completionList = completions ? completions.entries.filter(function (x) { return !!x; }) : [];
    if (prefix.length && prefix !== '.') {
        completionList = fuzzaldrin.filter(completionList, prefix, { key: 'name' });
    }
    if (completionList.length > 10)
        completionList = completionList.slice(0, 10);
    function docComment(c) {
        var completionDetails = program.languageService.getCompletionEntryDetails(filePath, position, c.name);
        if (c.kind == "method" || c.kind == "function") {
            var display = ts.displayPartsToString(completionDetails.displayParts || []);
        }
        else {
            var display = c.kind;
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
        })
    };
}
exports.getCompletionsAtPosition = getCompletionsAtPosition;
function emitFile(query) {
    return getOrCreateProject(query.filePath).emitFile(query.filePath);
}
exports.emitFile = emitFile;
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
    var program = getOrCreateProject(query.filePath);
    var definitions = program.languageService.getDefinitionAtPosition(query.filePath, query.position);
    if (!definitions || !definitions.length)
        return { definitions: [] };
    return {
        definitions: definitions.map(function (d) {
            var pos = program.languageServiceHost.getPositionFromIndex(d.fileName, d.textSpan.start());
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
