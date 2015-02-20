var path = require('path');
var fs = require('fs');
var tsconfig = require('../tsconfig/tsconfig');
function getEditorPosition(editor) {
    var bufferPos = editor.getCursorBufferPosition();
    return getEditorPositionForBufferPosition(editor, bufferPos);
}
exports.getEditorPosition = getEditorPosition;
function getEditorPositionForBufferPosition(editor, bufferPos) {
    var buffer = editor.getBuffer();
    return buffer.characterIndexForPosition(bufferPos);
}
exports.getEditorPositionForBufferPosition = getEditorPositionForBufferPosition;
function onDiskAndTs(editor) {
    if (editor instanceof require('atom').TextEditor) {
        var filePath = editor.getPath();
        var ext = path.extname(filePath);
        if (ext == '.ts') {
            if (fs.existsSync(filePath)) {
                return true;
            }
        }
    }
    return false;
}
exports.onDiskAndTs = onDiskAndTs;
function getFilePathPosition() {
    var editor = atom.workspace.getActiveTextEditor();
    var filePath = editor.getPath();
    var position = getEditorPosition(editor);
    return { filePath: filePath, position: position };
}
exports.getFilePathPosition = getFilePathPosition;
function getEditorsForAllPaths(filePaths) {
    var map = {};
    var activeEditors = atom.workspace.getEditors();
    function addConsistentlyToMap(editor) {
        map[tsconfig.consistentPath(editor.getPath())] = editor;
    }
    activeEditors.forEach(addConsistentlyToMap);
    var newPaths = filePaths.filter(function (p) { return !map[p]; });
    if (!newPaths.length)
        return Promise.resolve(map);
    var promises = newPaths.map(function (p) { return atom.workspace.open(p, {}); });
    return Promise.all(promises).then(function (editors) {
        editors.forEach(addConsistentlyToMap);
        return map;
    });
}
exports.getEditorsForAllPaths = getEditorsForAllPaths;
