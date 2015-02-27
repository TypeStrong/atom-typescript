var resolve = Promise.resolve.bind(Promise);
var atomUtils = require('../main/atom/atomUtils');
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
