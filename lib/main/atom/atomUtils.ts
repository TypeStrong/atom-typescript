

import path = require('path');
import fs = require('fs');
import _atom = require('atom');
import tsconfig = require('../tsconfig/tsconfig');

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

export function onDiskAndTs(editor: AtomCore.IEditor) {
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
        map[tsconfig.consistentPath(editor.getPath())] = editor;
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
    return getTypeScriptEditorsWithPaths().map(e=> tsconfig.consistentPath(e.getPath()));
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
    if (path.extname(editor.getPath()) !== '.ts') return e.abortKeyBinding() && false;

    return true;
}

/** Gets the consisten path for the current editor */
export function getCurrentPath() {
    var editor = atom.workspace.getActiveTextEditor();
    return tsconfig.consistentPath(editor.getPath());
}

export var knownScopes = {
    reference: 'reference.path.string',
    require: 'require.path.string',
    es6import: 'es6import.path.string'
}

export function editorInTheseScopes(matches: string[]) {
    var editor = atom.workspace.getActiveTextEditor();
    var scopes = editor.getCursorScopes();
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
