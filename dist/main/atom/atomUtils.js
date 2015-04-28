var path = require('path');
var fs = require('fs');
var _atom = require('atom');
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
        if (!filePath) {
            return false;
        }
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
function getFilePath() {
    var editor = atom.workspace.getActiveTextEditor();
    var filePath = editor.getPath();
    return { filePath: filePath };
}
exports.getFilePath = getFilePath;
function getEditorsForAllPaths(filePaths) {
    var map = {};
    var activeEditors = atom.workspace.getTextEditors().filter(function (editor) { return !!editor.getPath(); });
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
function getRangeForTextSpan(editor, ts) {
    var buffer = editor.buffer;
    var start = editor.buffer.positionForCharacterIndex(ts.start);
    var end = editor.buffer.positionForCharacterIndex(ts.start + ts.length);
    var range = new _atom.Range(start, end);
    return range;
}
exports.getRangeForTextSpan = getRangeForTextSpan;
function getTypeScriptEditorsWithPaths() {
    return atom.workspace.getTextEditors()
        .filter(function (editor) { return !!editor.getPath(); })
        .filter(function (editor) { return (path.extname(editor.getPath()) === '.ts'); });
}
exports.getTypeScriptEditorsWithPaths = getTypeScriptEditorsWithPaths;
function getOpenTypeScritEditorsConsistentPaths() {
    return getTypeScriptEditorsWithPaths().map(function (e) { return tsconfig.consistentPath(e.getPath()); });
}
exports.getOpenTypeScritEditorsConsistentPaths = getOpenTypeScritEditorsConsistentPaths;
function quickNotifySuccess(htmlMessage) {
    var notification = atom.notifications.addSuccess(htmlMessage, { dismissable: true });
    setTimeout(function () {
        notification.dismiss();
    }, 800);
}
exports.quickNotifySuccess = quickNotifySuccess;
function quickNotifyWarning(htmlMessage) {
    var notification = atom.notifications.addWarning(htmlMessage, { dismissable: true });
    setTimeout(function () {
        notification.dismiss();
    }, 800);
}
exports.quickNotifyWarning = quickNotifyWarning;
function formatCode(editor, edits) {
    for (var i = edits.length - 1; i >= 0; i--) {
        var edit = edits[i];
        editor.setTextInBufferRange([[edit.start.line, edit.start.col], [edit.end.line, edit.end.col]], edit.newText);
    }
}
exports.formatCode = formatCode;
function kindToColor(kind) {
    switch (kind) {
        case 'interface':
            return 'rgb(16, 255, 0)';
        case 'keyword':
            return 'rgb(0, 207, 255)';
        case 'class':
            return 'rgb(255, 0, 194)';
        default:
            return 'white';
    }
}
exports.kindToColor = kindToColor;
function kindToType(kind) {
    switch (kind) {
        case 'interface':
            return 'type';
        case 'identifier':
            return 'variable';
        case 'local function':
            return 'function';
        case 'local var':
            return 'variable';
        case 'var':
        case 'parameter':
            return 'variable';
        case 'alias':
            return 'import';
        case 'type parameter':
            return 'type';
        default:
            return kind.split(' ')[0];
    }
}
exports.kindToType = kindToType;
function commandForTypeScript(e) {
    var editor = atom.workspace.getActiveTextEditor();
    if (!editor)
        return e.abortKeyBinding() && false;
    if (path.extname(editor.getPath()) !== '.ts')
        return e.abortKeyBinding() && false;
    return true;
}
exports.commandForTypeScript = commandForTypeScript;
function getCurrentPath() {
    var editor = atom.workspace.getActiveTextEditor();
    return tsconfig.consistentPath(editor.getPath());
}
exports.getCurrentPath = getCurrentPath;
exports.knownScopes = {
    reference: 'reference.path.string',
    require: 'require.path.string',
    es6import: 'es6import.path.string'
};
function editorInTheseScopes(matches) {
    var editor = atom.workspace.getActiveTextEditor();
    var scopes = editor.getCursorScopes();
    var lastScope = scopes[scopes.length - 1];
    if (matches.some(function (p) { return lastScope === p; }))
        return lastScope;
    else
        return '';
}
exports.editorInTheseScopes = editorInTheseScopes;
function getActiveEditor() {
    return atom.workspace.getActiveTextEditor();
}
exports.getActiveEditor = getActiveEditor;
