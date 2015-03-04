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
    return Promise.resolve({ num: query.num + 10 });
}
exports.echoNumWithModification = echoNumWithModification;
function getUpdatedTextForUnsavedEditors(query) {
    var editors = atomUtils.getTypeScriptEditorsWithPaths().filter(function (editor) { return editor.isModified(); });
    return resolve({
        editors: editors.map(function (e) {
            return { filePath: e.getPath(), text: e.getText() };
        })
    });
}
exports.getUpdatedTextForUnsavedEditors = getUpdatedTextForUnsavedEditors;
function setProjectFileParsedResult(query) {
    var errors = [];
    if (query.error) {
        if (query.error.message == tsconfig.errors.GET_PROJECT_JSON_PARSE_FAILED) {
            var invalidJSONDetails = query.error.details;
            errors = [
                {
                    filePath: invalidJSONDetails.projectFilePath,
                    startPos: { line: 0, ch: 0 },
                    endPos: { line: 0, ch: 0 },
                    message: "The project file contains invalid JSON",
                    preview: invalidJSONDetails.projectFilePath,
                }
            ];
        }
    }
    errorView.setErrors(query.projectFilePath, errors);
    return resolve({});
}
exports.setProjectFileParsedResult = setProjectFileParsedResult;
