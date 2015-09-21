var path = require('path');
var fs = require('fs');
var fsu = require("../utils/fsUtil");
var _atom = require('atom');
var url = require('url');
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
function isAllowedExtension(ext) {
    return (ext == '.ts' || ext == '.tst' || ext == '.tsx');
}
exports.isAllowedExtension = isAllowedExtension;
function isActiveEditorOnDiskAndTs() {
    var editor = atom.workspace.getActiveTextEditor();
    return onDiskAndTs(editor);
}
exports.isActiveEditorOnDiskAndTs = isActiveEditorOnDiskAndTs;
function onDiskAndTs(editor) {
    if (editor instanceof require('atom').TextEditor) {
        var filePath = editor.getPath();
        if (!filePath) {
            return false;
        }
        var ext = path.extname(filePath);
        if (isAllowedExtension(ext)) {
            if (fs.existsSync(filePath)) {
                return true;
            }
        }
    }
    return false;
}
exports.onDiskAndTs = onDiskAndTs;
function onDiskAndTsRelated(editor) {
    if (editor instanceof require('atom').TextEditor) {
        var filePath = editor.getPath();
        if (!filePath) {
            return false;
        }
        var ext = path.extname(filePath);
        if (isAllowedExtension(ext)) {
            if (fs.existsSync(filePath)) {
                return true;
            }
        }
        if (filePath.endsWith('tsconfig.json')) {
            return true;
        }
    }
    return false;
}
exports.onDiskAndTsRelated = onDiskAndTsRelated;
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
        map[fsu.consistentPath(editor.getPath())] = editor;
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
    return getTypeScriptEditorsWithPaths().map(function (e) { return fsu.consistentPath(e.getPath()); });
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
    var ext = path.extname(editor.getPath());
    if (!isAllowedExtension(ext))
        return e.abortKeyBinding() && false;
    return true;
}
exports.commandForTypeScript = commandForTypeScript;
function getCurrentPath() {
    var editor = atom.workspace.getActiveTextEditor();
    return fsu.consistentPath(editor.getPath());
}
exports.getCurrentPath = getCurrentPath;
exports.knownScopes = {
    reference: 'reference.path.string',
    require: 'require.path.string',
    es6import: 'es6import.path.string'
};
function editorInTheseScopes(matches) {
    var editor = atom.workspace.getActiveTextEditor();
    var scopes = editor.getLastCursor().getScopeDescriptor().scopes;
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
function uriForPath(uriProtocol, filePath) {
    return uriProtocol + "//" + filePath;
}
exports.uriForPath = uriForPath;
function registerOpener(config) {
    atom.commands.add(config.commandSelector, config.commandName, function (e) {
        if (!commandForTypeScript(e))
            return;
        var uri = uriForPath(config.uriProtocol, getCurrentPath());
        var old_pane = atom.workspace.paneForURI(uri);
        if (old_pane) {
            old_pane.destroyItem(old_pane.itemForUri(uri));
        }
        atom.workspace.open(uri, config.getData());
    });
    atom.workspace.addOpener(function (uri, data) {
        try {
            var protocol = url.parse(uri).protocol;
        }
        catch (error) {
            return;
        }
        if (protocol !== config.uriProtocol) {
            return;
        }
        return config.onOpen(data);
    });
}
exports.registerOpener = registerOpener;
function triggerLinter() {
    atom.commands.dispatch(atom.views.getView(atom.workspace.getActiveTextEditor()), 'linter:lint');
}
exports.triggerLinter = triggerLinter;
function getFilePathRelativeToAtomProject(filePath) {
    filePath = fsu.consistentPath(filePath);
    return '~' + atom.project.relativize(filePath);
}
exports.getFilePathRelativeToAtomProject = getFilePathRelativeToAtomProject;
function openFile(filePath, position) {
    if (position === void 0) { position = {}; }
    var config = {};
    if (position.line) {
        config.initialLine = position.line - 1;
    }
    if (position.col) {
        config.initialColumn = position.col;
    }
    atom.workspace.open(filePath, config);
}
exports.openFile = openFile;
var _snippetsManager;
function _setSnippetsManager(snippetsManager) {
    _snippetsManager = snippetsManager;
}
exports._setSnippetsManager = _setSnippetsManager;
function insertSnippet(snippet, editor, cursor) {
    if (_snippetsManager) {
        _snippetsManager.insertSnippet(snippet, editor, cursor);
    }
    else {
        console.error('Why no snippet manager?');
    }
}
exports.insertSnippet = insertSnippet;
