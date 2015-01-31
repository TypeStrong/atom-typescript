///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

///ts:import=languageServiceHost
import languageServiceHost = require('../lang/languageServiceHost'); ///ts:import:generated

// Optimized version where we do not ask this of the languageServiceHost
export function getEditorPosition(editor:AtomCore.IEditor): number{
	var bufferPos = editor.getCursorBufferPosition();
	return getEditorPositionForBufferPosition(editor,bufferPos);
}

// Further optimized if you already have the bufferPos
export function getEditorPositionForBufferPosition(editor: AtomCore.IEditor, bufferPos: TextBuffer.IPoint):number{
	var buffer = editor.getBuffer();
	return buffer.characterIndexForPosition(bufferPos);
}
