///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

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

export function getEditorsForAllPaths(filePaths: string[]): Promise<{ [filePath: string]: AtomCore.IEditor }> {
    var map = <any>{};
    var activeEditors = atom.workspace.getEditors().filter(editor=> !!editor.getPath());

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
    return atom.workspace.getEditors()
        .filter(editor=> !!editor.getPath())
        .filter(editor=> (path.extname(editor.getPath()) === '.ts'));
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
