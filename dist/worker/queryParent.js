var resolve = Promise.resolve.bind(Promise);
var tsconfig = require('../main/tsconfig/tsconfig');
var atomUtils;
var errorView;
try {
    require('atom');
    atomUtils = require('../main/atom/atomUtils');
    errorView = require('../main/atom/errorView');
}
catch (ex) {
}
function echoNumWithModification(query) {
    return Promise.resolve({
        num: query.num + 10
    });
}
exports.echoNumWithModification = echoNumWithModification;
function getUpdatedTextForUnsavedEditors(query) {
    var editors = atomUtils.getTypeScriptEditorsWithPaths().filter(function (editor) {
        return editor.isModified();
    });
    return resolve({
        editors: editors.map(function (e) {
            return {
                filePath: e.getPath(),
                text: e.getText()
            };
        })
    });
}
exports.getUpdatedTextForUnsavedEditors = getUpdatedTextForUnsavedEditors;
function getOpenEditorPaths(query) {
    var editors = atomUtils.getTypeScriptEditorsWithPaths();
    return resolve({
        filePaths: editors.map(function (e) {
            return tsconfig.consistentPath(e.getPath());
        })
    });
}
exports.getOpenEditorPaths = getOpenEditorPaths;
function setConfigurationError(query) {
    var errors = [];
    if (query.error) {
        if (query.error.message == tsconfig.errors.GET_PROJECT_JSON_PARSE_FAILED) {
            var details = query.error.details;
            errors = [
                {
                    filePath: details.projectFilePath,
                    startPos: {
                        line: 0,
                        col: 0
                    },
                    endPos: {
                        line: 0,
                        col: 0
                    },
                    message: "The project file contains invalid JSON",
                    preview: details.projectFilePath,
                }
            ];
        }
        if (query.error.message == tsconfig.errors.GET_PROJECT_PROJECT_FILE_INVALID_OPTIONS) {
            var _details = query.error.details;
            errors = [
                {
                    filePath: _details.projectFilePath,
                    startPos: {
                        line: 0,
                        col: 0
                    },
                    endPos: {
                        line: 0,
                        col: 0
                    },
                    message: "The project file contains invalid options",
                    preview: _details.errorMessage,
                }
            ];
        }
        if (query.error.message == tsconfig.errors.GET_PROJECT_GLOB_EXPAND_FAILED) {
            var _details_1 = query.error.details;
            errors = [
                {
                    filePath: _details_1.projectFilePath,
                    startPos: {
                        line: 0,
                        col: 0
                    },
                    endPos: {
                        line: 0,
                        col: 0
                    },
                    message: "Failed to expand the glob for the project file",
                    preview: _details_1.errorMessage,
                }
            ];
        }
    }
    errorView.setErrors(query.projectFilePath, errors);
    return resolve({});
}
exports.setConfigurationError = setConfigurationError;
function notifySuccess(query) {
    atom.notifications.addSuccess(query.message);
    return resolve({});
}
exports.notifySuccess = notifySuccess;
//# sourceMappingURL=queryParent.js.map