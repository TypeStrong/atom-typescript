

import path = require('path');
import fs = require('fs');
import * as fsu from "../utils/fsUtil";
import _atom = require('atom');
import tsconfig = require('../tsconfig/tsconfig');
import url = require('url');

// Optimized version where we do not ask this of the languageServiceHost
export function getEditorPosition(editor: AtomCore.IEditor): number {
    var bufferPos = editor.getCursorBufferPosition();
    return getEditorPositionForBufferPosition(editor, bufferPos);
}

// Further optimized if you already have the bufferPos
export function getEditorPositionForBufferPosition(editor: AtomCore.IEditor, bufferPos: TextBuffer.IPoint): number {
    var buffer = editor.getBuffer();
    return buffer.characterIndexForPosition(bufferPos);
}

export function isAllowedExtension(ext: string) {
    return (ext == '.ts' || ext == '.tst' || ext == '.tsx');
}

export function isActiveEditorOnDiskAndTs() {
    var editor = atom.workspace.getActiveTextEditor();
    return onDiskAndTs(editor);
}
export function onDiskAndTs(editor: AtomCore.IEditor) {
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

/** Either ts or tsconfig */
export function onDiskAndTsRelated(editor: AtomCore.IEditor) {
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

export function getFilePathPosition(): { filePath: string; position: number } {
    var editor = atom.workspace.getActiveTextEditor();
    var filePath = editor.getPath();
    var position = getEditorPosition(editor);
    return { filePath, position };
}

export function getFilePath(): { filePath: string; } {
    var editor = atom.workspace.getActiveTextEditor();
    var filePath = editor.getPath();
    return { filePath };
}

export function getEditorsForAllPaths(filePaths: string[]): Promise<{ [filePath: string]: AtomCore.IEditor }> {
    var map = <any>{};
    var activeEditors = atom.workspace.getTextEditors().filter(editor=> !!editor.getPath());

    function addConsistentlyToMap(editor: AtomCore.IEditor) {
        map[fsu.consistentPath(editor.getPath())] = editor;
    }

    activeEditors.forEach(addConsistentlyToMap);

    /// find the editors that are not in here
    var newPaths = filePaths.filter(p=> !map[p]);
    if (!newPaths.length) return Promise.resolve(map);

    var promises = newPaths.map(p=> atom.workspace.open(p, {}));

    return Promise.all(promises).then(editors=> {
        editors.forEach(addConsistentlyToMap);

        return map;
    });
}

export function getRangeForTextSpan(editor: AtomCore.IEditor, ts: { start: number; length: number }): TextBuffer.IRange {
    var buffer = editor.buffer;
    var start = editor.buffer.positionForCharacterIndex(ts.start);
    var end = editor.buffer.positionForCharacterIndex(ts.start + ts.length);
    var range = new _atom.Range(start, end);
    return range;
}

/** only the editors that are persisted to disk. And are of type TypeScript */
export function getTypeScriptEditorsWithPaths() {
    return atom.workspace.getTextEditors()
        .filter(editor=> !!editor.getPath())
        .filter(editor=> (path.extname(editor.getPath()) === '.ts'));
}

export function getOpenTypeScritEditorsConsistentPaths() {
    return getTypeScriptEditorsWithPaths().map(e=> fsu.consistentPath(e.getPath()));
}

export function quickNotifySuccess(htmlMessage: string) {
    var notification = atom.notifications.addSuccess(htmlMessage, { dismissable: true });
    setTimeout(() => {
        notification.dismiss()
    }, 800);
}

export function quickNotifyWarning(htmlMessage: string) {
    var notification = atom.notifications.addWarning(htmlMessage, { dismissable: true });
    setTimeout(() => {
        notification.dismiss()
    }, 800);
}

type Location = { line: number; col: number };
export interface CodeEdit {
    start: Location;
    end: Location;
    newText: string;
}
export function formatCode(editor: AtomCore.IEditor, edits: CodeEdit[]) {
    for (var i = edits.length - 1; i >= 0; i--) {
        var edit = edits[i];
        editor.setTextInBufferRange([[edit.start.line, edit.start.col], [edit.end.line, edit.end.col]], edit.newText);
    }
}

export function kindToColor(kind: string) {
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

/** See types :
 * https://github.com/atom-community/autocomplete-plus/pull/334#issuecomment-85697409
 */
export function kindToType(kind: string) {
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

/** Utility functions for commands */
export function commandForTypeScript(e) {
    var editor = atom.workspace.getActiveTextEditor();
    if (!editor) return e.abortKeyBinding() && false;
    var ext = path.extname(editor.getPath());
    if (!isAllowedExtension(ext)) return e.abortKeyBinding() && false;

    return true;
}

/** Gets the consisten path for the current editor */
export function getCurrentPath() {
    var editor = atom.workspace.getActiveTextEditor();
    return fsu.consistentPath(editor.getPath());
}

export var knownScopes = {
    reference: 'reference.path.string',
    require: 'require.path.string',
    es6import: 'es6import.path.string'
}

export function editorInTheseScopes(matches: string[]) {
    var editor = atom.workspace.getActiveTextEditor();
    var scopes = editor.getLastCursor().getScopeDescriptor().scopes;
    var lastScope = scopes[scopes.length - 1];
    if (matches.some(p=> lastScope === p))
        return lastScope;
    else
        return '';
}

/** One less level of indirection */
export function getActiveEditor() {
    return atom.workspace.getActiveTextEditor();
}


export interface OpenerConfig<T> {
    commandSelector: string;
    commandName: string;
    uriProtocol: string;
    getData: () => T;
    onOpen: (data: T) => any;
}

/**
 * Uri for filepath based on protocol
 */
export function uriForPath(uriProtocol: string, filePath: string) {
    return uriProtocol + "//" + filePath;
}

/**
 * Registers an opener with atom
 */
export function registerOpener<T>(config: OpenerConfig<T>) {
    atom.commands.add(config.commandSelector, config.commandName, (e) => {
        if (!commandForTypeScript(e)) return;

        var uri = uriForPath(config.uriProtocol, getCurrentPath());
        var old_pane = atom.workspace.paneForURI(uri);
        if (old_pane) {
            old_pane.destroyItem(old_pane.itemForUri(uri));
        }

        atom.workspace.open(uri, config.getData());
    });

    atom.workspace.addOpener(function(uri, data: T) {
        try {
            var {protocol} = url.parse(uri);
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

export function triggerLinter() {
    // also invalidate linter
    atom.commands.dispatch(
        atom.views.getView(atom.workspace.getActiveTextEditor()),
        'linter:lint');
}

/**
 * converts "c:\dev\somethin\bar.ts" to "~something\bar".
 */
export function getFilePathRelativeToAtomProject(filePath: string) {
    filePath = fsu.consistentPath(filePath);
    // Sample:
    // atom.project.relativize(`D:/REPOS/atom-typescript/lib/main/atom/atomUtils.ts`)
    return '~' + atom.project.relativize(filePath);
}

/**
 * Opens the given file in the same project
 */
export function openFile(filePath: string, position: { line?: number; col?: number } = {}) {
    var config: any = {};
    if (position.line) {
        config.initialLine = position.line - 1;
    }
    if (position.col) {
        config.initialColumn = position.col;
    }
    atom.workspace.open(filePath, config);
}

/************
 * Snippets *
 ************/
var _snippetsManager;
export function _setSnippetsManager(snippetsManager) {
    _snippetsManager = snippetsManager;
}
export function insertSnippet(snippet: string, editor: AtomCore.IEditor, cursor: AtomCore.ICursor) {
    if (_snippetsManager) {
        _snippetsManager.insertSnippet(snippet, editor, cursor);
    } else {
        console.error('Why no snippet manager?');
    }
}
