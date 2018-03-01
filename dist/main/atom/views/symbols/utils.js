"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: Hook this into return-from-declaration and findReferences
async function openTag(tag) {
    if (tag.file) {
        return atom.workspace.open(tag.file, {
            initialLine: tag.position.row,
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