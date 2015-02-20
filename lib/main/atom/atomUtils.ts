///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

///ts:import=languageServiceHost
import languageServiceHost = require('../lang/languageServiceHost'); ///ts:import:generated
import path = require('path');
import fs = require('fs');
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
    var activeEditors = atom.workspace.getEditors();

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
