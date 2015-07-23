var fs = require("fs");
var path = require("path");
var tsconfig = require("../tsconfig/tsconfig");
var project_1 = require("./core/project");
var fsu = require("../utils/fsUtil");
var queryParent = require('../../worker/queryParent');
exports.queryParent = queryParent;
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
function consistentPath(query) {
    if (!query.filePath)
        return;
    query.filePath = fsu.consistentPath(query.filePath);
}
exports.consistentPath = consistentPath;
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
    fs.watch(projectFilePath, { persistent: false }, function () {
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
function cacheAndCreateProject(projectFile) {
    var project = projectByProjectFilePath[projectFile.projectFilePath] = new project_1.Project(projectFile);
    projectFile.project.files.forEach(function (file) { return projectByFilePath[file] = project; });
    queryParent.getUpdatedTextForUnsavedEditors({})
        .then(function (resp) {
        resp.editors.forEach(function (e) {
            consistentPath(e);
            project.languageServiceHost.updateScript(e.filePath, e.text);
        });
    });
    watchProjectFileIfNotDoingItAlready(projectFile.projectFilePath);
    return project;
}
exports.cacheAndCreateProject = cacheAndCreateProject;
function getOrCreateProjectFile(filePath) {
    try {
        if (path.dirname(filePath) == project_1.languageServiceHost.typescriptDirectory) {
            return tsconfig.getDefaultInMemoryProject(filePath);
        }
        var projectFile = tsconfig.getProjectSync(filePath);
        queryParent.setConfigurationError({ projectFilePath: projectFile.projectFilePath, error: null });
        return projectFile;
    }
    catch (ex) {
        var err = ex;
        if (err.message === tsconfig.errors.GET_PROJECT_NO_PROJECT_FOUND) {
            if (tsconfig.endsWith(filePath.toLowerCase(), '.d.ts')) {
                return tsconfig.getDefaultInMemoryProject(filePath);
            }
            else {
                var details = ex.details;
                queryParent.setConfigurationError({
                    projectFilePath: details.projectFilePath,
                    error: {
                        message: ex.message,
                        details: ex.details
                    }
                });
            }
        }
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
exports.getOrCreateProjectFile = getOrCreateProjectFile;
function getOrCreateProject(filePath) {
    if (tsconfig.endsWith(filePath, '.tst')) {
        filePath = filePath + '.ts';
    }
    filePath = fsu.consistentPath(filePath);
    if (projectByFilePath[filePath]) {
        return projectByFilePath[filePath];
    }
    else {
        var projectFile = getOrCreateProjectFile(filePath);
        var project = cacheAndCreateProject(projectFile);
        return project;
    }
}
exports.getOrCreateProject = getOrCreateProject;
function resetCache(query) {
    projectByProjectFilePath = {};
    projectByFilePath = {};
    if (query.filePath) {
        consistentPath(query);
        var project = getOrCreateProject(query.filePath);
        project.languageServiceHost.updateScript(query.filePath, query.text);
    }
    queryParent.getUpdatedTextForUnsavedEditors({})
        .then(function (resp) {
        resp.editors.forEach(function (e) {
            consistentPath(e);
            var proj = getOrCreateProject(e.filePath);
            proj.languageServiceHost.updateScript(e.filePath, e.text);
        });
    });
}
exports.resetCache = resetCache;
