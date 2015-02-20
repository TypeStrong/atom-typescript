///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

///ts:import=languageServiceHost
import languageServiceHost = require('../lang/languageServiceHost'); ///ts:import:generated
import path = require('path');
import fs = require('fs');

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
