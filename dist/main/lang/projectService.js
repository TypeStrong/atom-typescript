var fs = require('fs');
var path = require('path');
var ts = require('typescript');
var mkdirp = require('mkdirp');
var fuzzaldrin = require('fuzzaldrin');
var tsconfig = require('../tsconfig/tsconfig');
var utils = require('./utils');
var project = require('./project');
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
    fs.watch(projectFilePath, {
        persistent: false,
        recursive: false
    }, function () {
        if (!fs.existsSync(projectFilePath)) {
            var project = projectByProjectFilePath[projectFilePath];
            if (project) {
                var files = project.projectFile.project.files;
                delete projectByProjectFilePath[projectFilePath];
                files.forEach(function (file) {
                    return delete projectByFilePath[file];
                });
            }
            return;
        }
        try {
            var projectFile = getOrCreateProjectFile(projectFilePath);
            cacheAndCreateProject(projectFile);
            queryParent.setConfigurationError({
                projectFilePath: projectFile.projectFilePath,
                error: null
            });
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
            if (openPaths.some(function (x) {
                return x == filePath;
            })) {
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
    projectFile.project.files.forEach(function (file) {
        return projectByFilePath[file] = project;
    });
    queryParent.getUpdatedTextForUnsavedEditors({}).then(function (resp) {
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
        if (path.dirname(filePath) == path.dirname(languageServiceHost.defaultLibFile)) {
            return tsconfig.getDefaultProject(filePath);
        }
        var projectFile = tsconfig.getProjectSync(filePath);
        queryParent.setConfigurationError({
            projectFilePath: projectFile.projectFilePath,
            error: null
        });
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
                queryParent.notifySuccess({
                    message: 'AtomTS: tsconfig.json file created: <br/>' + projectFile.projectFilePath
                });
                queryParent.setConfigurationError({
                    projectFilePath: projectFile.projectFilePath,
                    error: null
                });
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
    return queryParent.echoNumWithModification({
        num: data.num
    }).then(function (resp) {
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
        return Promise.resolve({
            valid: false
        });
    else
        return resolve({
            valid: true,
            name: ts.displayPartsToString(info.displayParts || []),
            comment: ts.displayPartsToString(info.documentation || []),
        });
}
exports.quickInfo = quickInfo;
function _diagnosticToTSError(diagnostic) {
    var filePath = diagnostic.file.fileName;
    var startPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    var endPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start + diagnostic.length);
    return {
        filePath: filePath,
        startPos: {
            line: startPosition.line,
            col: startPosition.character
        },
        endPos: {
            line: endPosition.line,
            col: endPosition.character
        },
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        preview: diagnostic.file.text.substr(diagnostic.start, diagnostic.length),
    };
}
function _build(proj) {
    var totalCount = proj.projectFile.project.files.length;
    var builtCount = 0;
    var errorCount = 0;
    var outputs = proj.projectFile.project.files.map(function (filePath) {
        var output = _emitFile(proj, filePath);
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
    return {
        outputs: outputs,
        counts: {
            inputFiles: proj.projectFile.project.files.length,
            outputFiles: utils.selectMany(outputs.map(function (out) {
                return out.outputFiles;
            })).length,
            errors: errorCount,
            emitErrors: outputs.filter(function (out) {
                return out.emitError;
            }).length
        }
    };
}
function _emitFile(proj, filePath) {
    var services = proj.languageService;
    var output = services.getEmitOutput(filePath);
    var emitDone = !output.emitSkipped;
    var errors = [];
    var allDiagnostics = services.getCompilerOptionsDiagnostics().concat(services.getSyntacticDiagnostics(filePath)).concat(services.getSemanticDiagnostics(filePath));
    allDiagnostics.forEach(function (diagnostic) {
        if (!diagnostic.file)
            return;
        var startPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        errors.push(_diagnosticToTSError(diagnostic));
    });
    output.outputFiles.forEach(function (o) {
        mkdirp.sync(path.dirname(o.name));
        fs.writeFileSync(o.name, o.text, "utf8");
    });
    var outputFiles = output.outputFiles.map(function (o) {
        return o.name;
    });
    if (path.extname(filePath) == '.d.ts') {
        outputFiles.push(filePath);
    }
    return {
        outputFiles: outputFiles,
        success: emitDone && !errors.length,
        errors: errors,
        emitError: !emitDone
    };
}
function build(query) {
    consistentPath(query);
    return resolve({
        outputs: _build(getOrCreateProject(query.filePath))
    });
}
exports.build = build;
function errorsForFileFiltered(query) {
    consistentPath(query);
    var fileName = path.basename(query.filePath);
    return errorsForFile({
        filePath: query.filePath
    }).then(function (resp) {
        return {
            errors: resp.errors.filter(function (error) {
                return path.basename(error.filePath) == fileName;
            })
        };
    });
}
exports.errorsForFileFiltered = errorsForFileFiltered;
var punctuations = utils.createMap([
    ';',
    '{',
    '}',
    '(',
    ')',
    '.',
    ':',
    '<',
    '>',
    "'",
    '"'
]);
var prefixEndsInPunctuation = function (prefix) {
    return prefix.length && prefix.trim().length && punctuations[prefix.trim()[prefix.trim().length - 1]];
};
function getCompletionsAtPosition(query) {
    consistentPath(query);
    var filePath = query.filePath, position = query.position, prefix = query.prefix;
    var project = getOrCreateProject(filePath);
    var completions = project.languageService.getCompletionsAtPosition(filePath, position);
    var completionList = completions ? completions.entries.filter(function (x) {
        return !!x;
    }) : [];
    var endsInPunctuation = prefixEndsInPunctuation(prefix);
    if (prefix.length && !endsInPunctuation) {
        completionList = fuzzaldrin.filter(completionList, prefix, {
            key: 'name'
        });
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
        return {
            display: display,
            comment: comment
        };
    }
    return resolve({
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
    });
}
exports.getCompletionsAtPosition = getCompletionsAtPosition;
function getSignatureHelps(query) {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var signatureHelpItems = project.languageService.getSignatureHelpItems(query.filePath, query.position);
    if (!signatureHelpItems || !signatureHelpItems.items || !signatureHelpItems.items.length)
        return resolve({
            signatureHelps: []
        });
    return signatureHelpItems.items;
}
exports.getSignatureHelps = getSignatureHelps;
function emitFile(query) {
    consistentPath(query);
    return resolve(_emitFile(getOrCreateProject(query.filePath), query.filePath));
}
exports.emitFile = emitFile;
function _formatDocument(proj, filePath) {
    var textChanges = proj.languageService.getFormattingEditsForDocument(filePath, proj.projectFile.project.formatCodeOptions);
    var edits = textChanges.map(function (change) {
        return {
            start: proj.languageServiceHost.getPositionFromIndex(filePath, change.span.start),
            end: proj.languageServiceHost.getPositionFromIndex(filePath, change.span.start + change.span.length),
            newText: change.newText
        };
    });
    return edits;
}
function _formatDocumentRange(proj, filePath, start, end) {
    var st = proj.languageServiceHost.getIndexFromPosition(filePath, start);
    var ed = proj.languageServiceHost.getIndexFromPosition(filePath, end);
    var textChanges = proj.languageService.getFormattingEditsForRange(filePath, st, ed, proj.projectFile.project.formatCodeOptions);
    var edits = textChanges.map(function (change) {
        return {
            start: proj.languageServiceHost.getPositionFromIndex(filePath, change.span.start),
            end: proj.languageServiceHost.getPositionFromIndex(filePath, change.span.start + change.span.length),
            newText: change.newText
        };
    });
    return edits;
}
function formatDocument(query) {
    consistentPath(query);
    var proj = getOrCreateProject(query.filePath);
    return resolve({
        edits: _formatDocument(proj, query.filePath)
    });
}
exports.formatDocument = formatDocument;
function formatDocumentRange(query) {
    consistentPath(query);
    var proj = getOrCreateProject(query.filePath);
    return resolve({
        edits: _formatDocumentRange(proj, query.filePath, query.start, query.end)
    });
}
exports.formatDocumentRange = formatDocumentRange;
function getDefinitionsAtPosition(query) {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var definitions = project.languageService.getDefinitionAtPosition(query.filePath, query.position);
    var projectFileDirectory = project.projectFile.projectFileDirectory;
    if (!definitions || !definitions.length)
        return resolve({
            projectFileDirectory: projectFileDirectory,
            definitions: []
        });
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
function errorsForFile(query) {
    consistentPath(query);
    var program = getOrCreateProject(query.filePath);
    var diagnostics = program.languageService.getSyntacticDiagnostics(query.filePath);
    if (diagnostics.length === 0) {
        diagnostics = program.languageService.getSemanticDiagnostics(query.filePath);
    }
    return resolve({
        errors: diagnostics.map(_diagnosticToTSError)
    });
}
exports.errorsForFile = errorsForFile;
function getRenameInfo(query) {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var findInStrings = false, findInComments = false;
    var info = project.languageService.getRenameInfo(query.filePath, query.position);
    if (info && info.canRename) {
        var locations = {};
        project.languageService.findRenameLocations(query.filePath, query.position, findInStrings, findInComments).forEach(function (loc) {
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
function filePathWithoutExtension(query) {
    var base = path.basename(query, '.ts');
    return path.dirname(query) + '/' + base;
}
function getRelativePathsInProject(query) {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var sourceDir = path.dirname(query.filePath);
    var filePaths = project.projectFile.project.files.filter(function (p) {
        return p !== query.filePath;
    });
    var files = filePaths.map(function (p) {
        return {
            name: path.basename(p, '.ts'),
            relativePath: tsconfig.removeExt(tsconfig.makeRelativePath(sourceDir, p)),
            fullPath: p
        };
    });
    var endsInPunctuation = prefixEndsInPunctuation(query.prefix);
    if (!endsInPunctuation)
        files = fuzzaldrin.filter(files, query.prefix, {
            key: 'name'
        });
    var response = {
        files: files,
        endsInPunctuation: endsInPunctuation
    };
    return resolve(response);
}
exports.getRelativePathsInProject = getRelativePathsInProject;
function getIndentationAtPosition(query) {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    var indent = project.languageService.getIndentationAtPosition(query.filePath, query.position, project.projectFile.project.formatCodeOptions);
    return resolve({
        indent: indent
    });
}
exports.getIndentationAtPosition = getIndentationAtPosition;
function debugLanguageServiceHostVersion(query) {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    return resolve({
        text: project.languageServiceHost.getScriptContent(query.filePath)
    });
}
exports.debugLanguageServiceHostVersion = debugLanguageServiceHostVersion;
function getProjectFileDetails(query) {
    consistentPath(query);
    var project = getOrCreateProject(query.filePath);
    return resolve(project.projectFile);
}
exports.getProjectFileDetails = getProjectFileDetails;
//# sourceMappingURL=projectService.js.map