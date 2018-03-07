"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function openTag(tag, editor, ephm) {
    if (tag.file !== undefined) {
        return ephm.goForward(editor, {
            file: tag.file,
            start: {
                line: tag.position.row + 1,
                offset: tag.position.column + 1,
            },
        });
    }
}
exports.openTag = openTag;
function serializeEditorState(editor) {
    const editorElement = atom.views.getView(editor);
    const scrollTop = editorElement.getScrollTop();
    return {
        bufferRanges: editor.getSelectedBufferRanges(),
        scrollTop,
    };
}
exports.serializeEditorState = serializeEditorState;
function deserializeEditorState(editor, { bufferRanges, scrollTop }) {
    const editorElement = atom.views.getView(editor);
    editor.setSelectedBufferRanges(bufferRanges);
    editorElement.setScrollTop(scrollTop);
}
exports.deserializeEditorState = deserializeEditorState;
//# sourceMappingURL=utils.js.map