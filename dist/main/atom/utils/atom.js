"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Atom = require("atom");
const fs = require("fs");
const path = require("path");
const url = require("url");
const _1 = require("./");
// Return line/offset position in the editor using 1-indexed coordinates
function getEditorPosition(editor) {
    const pos = editor.getCursorBufferPosition();
    return {
        line: pos.row + 1,
        offset: pos.column + 1
    };
}
exports.getEditorPosition = getEditorPosition;
function isTypescriptFile(filePath) {
    if (!filePath)
        return false;
    const ext = path.extname(filePath);
    return ext === ".ts" || ext === ".tsx";
}
exports.isTypescriptFile = isTypescriptFile;
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
/** Either ts or tsconfig */
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
    const editor = atom.workspace.getActiveTextEditor();
    return Object.assign({ file: editor.getPath() }, getEditorPosition(editor));
}
exports.getFilePathPosition = getFilePathPosition;
function getFilePath() {
    var editor = atom.workspace.getActiveTextEditor();
    var filePath = editor.getPath();
    return { filePath };
}
exports.getFilePath = getFilePath;
function getEditorsForAllPaths(filePaths) {
    var map = {};
    var activeEditors = atom.workspace.getTextEditors().filter(editor => !!editor.getPath());
    function addConsistentlyToMap(editor) {
        map[_1.consistentPath(editor.getPath())] = editor;
    }
    activeEditors.forEach(addConsistentlyToMap);
    /// find the editors that are not in here
    var newPaths = filePaths.filter(p => !map[p]);
    if (!newPaths.length)
        return Promise.resolve(map);
    var promises = newPaths.map(p => atom.workspace.open(p, {})); // Update Atom typings!
    return Promise.all(promises).then(editors => {
        editors.forEach(editor => addConsistentlyToMap(editor));
        return map;
    });
}
exports.getEditorsForAllPaths = getEditorsForAllPaths;
function getRangeForTextSpan(editor, ts) {
    var start = editor.buffer.positionForCharacterIndex(ts.start);
    var end = editor.buffer.positionForCharacterIndex(ts.start + ts.length);
    var range = new Atom.Range(start, end);
    return range;
}
exports.getRangeForTextSpan = getRangeForTextSpan;
/** only the editors that are persisted to disk. And are of type TypeScript */
function getTypeScriptEditorsWithPaths() {
    return atom.workspace.getTextEditors()
        .filter(editor => !!editor.getPath())
        .filter(editor => (path.extname(editor.getPath()) === '.ts'));
}
exports.getTypeScriptEditorsWithPaths = getTypeScriptEditorsWithPaths;
function getOpenTypeScritEditorsConsistentPaths() {
    return getTypeScriptEditorsWithPaths().map(e => _1.consistentPath(e.getPath()));
}
exports.getOpenTypeScritEditorsConsistentPaths = getOpenTypeScritEditorsConsistentPaths;
function quickNotifySuccess(htmlMessage) {
    var notification = atom.notifications.addSuccess(htmlMessage, { dismissable: true });
    setTimeout(() => {
        notification.dismiss();
    }, 800);
}
exports.quickNotifySuccess = quickNotifySuccess;
function quickNotifyWarning(htmlMessage) {
    var notification = atom.notifications.addWarning(htmlMessage, { dismissable: true });
    setTimeout(() => {
        notification.dismiss();
    }, 800);
}
exports.quickNotifyWarning = quickNotifyWarning;
function formatCode(editor, edits) {
    // The code edits need to be applied in reverse order
    for (let i = edits.length - 1; i >= 0; i--) {
        editor.setTextInBufferRange(_1.spanToRange(edits[i]), edits[i].newText);
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
/** See types :
 * https://github.com/atom-community/autocomplete-plus/pull/334#issuecomment-85697409
 */
function kindToType(kind) {
    // variable, constant, property, value, method, function, class, type, keyword, tag, snippet, import, require
    switch (kind) {
        case 'const':
            return 'constant';
        case 'interface':
            return 'type';
        case 'identifier':
            return 'variable';
        case 'local function':
            return 'function';
        case 'local var':
            return 'variable';
        case 'let':
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
/** Utility functions for commands */
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
/** Gets the consisten path for the current editor */
function getCurrentPath() {
    var editor = atom.workspace.getActiveTextEditor();
    return _1.consistentPath(editor.getPath());
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
    if (matches.some(p => lastScope === p))
        return lastScope;
    else
        return '';
}
exports.editorInTheseScopes = editorInTheseScopes;
/** One less level of indirection */
function getActiveEditor() {
    return atom.workspace.getActiveTextEditor();
}
exports.getActiveEditor = getActiveEditor;
/**
 * Uri for filepath based on protocol
 */
function uriForPath(uriProtocol, filePath) {
    return uriProtocol + "//" + filePath;
}
exports.uriForPath = uriForPath;
/**
 * Registers an opener with atom
 */
function registerOpener(config) {
    atom.commands.add(config.commandSelector, config.commandName, (e) => {
        if (!commandForTypeScript(e))
            return;
        var uri = uriForPath(config.uriProtocol, getCurrentPath());
        var old_pane = atom.workspace.paneForURI(uri);
        if (old_pane) {
            old_pane.destroyItem(old_pane.itemForURI(uri));
        }
        atom.workspace.open(uri, config.getData());
    });
    atom.workspace.addOpener(function (uri, data) {
        try {
            var { protocol } = url.parse(uri);
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
    // also invalidate linter
    atom.commands.dispatch(atom.views.getView(atom.workspace.getActiveTextEditor()), 'linter:lint');
}
exports.triggerLinter = triggerLinter;
/**
 * converts "c:\dev\somethin\bar.ts" to "~something\bar".
 */
function getFilePathRelativeToAtomProject(filePath) {
    filePath = _1.consistentPath(filePath);
    // Sample:
    // atom.project.relativize(`D:/REPOS/atom-typescript/lib/main/atom/atomUtils.ts`)
    return '~' + atom.project.relativize(filePath);
}
exports.getFilePathRelativeToAtomProject = getFilePathRelativeToAtomProject;
/**
 * Opens the given file in the same project
 */
function openFile(filePath, position = {}) {
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
//# sourceMappingURL=atom.js.map