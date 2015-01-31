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
