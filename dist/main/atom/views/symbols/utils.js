"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fuzzaldrin_1 = require("fuzzaldrin");
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
// extracted/adapted from symbols-view package (symbols-view.js::SymbolsView.highlightMatches)
function highlightMatches(name, query, offsetIndex = 0) {
    let lastIndex = 0;
    let matchedChars = []; // Build up a set of matched chars to be more semantic
    const queryMatches = [];
    const matches = fuzzaldrin_1.match(name, query);
    let matchIndex;
    for (matchIndex of Array.from(matches)) {
        matchIndex -= offsetIndex;
        if (matchIndex < 0) {
            continue; // If marking up the basename, omit name matches
        }
        const unmatched = name.substring(lastIndex, matchIndex);
        if (unmatched) {
            if (matchedChars.length) {
                queryMatches.push({ text: matchedChars.join(""), type: "character-match" });
            }
            matchedChars = [];
            queryMatches.push({ text: unmatched });
        }
        matchedChars.push(name[matchIndex]);
        lastIndex = matchIndex + 1;
    }
    if (matchedChars.length) {
        queryMatches.push({ text: matchedChars.join(""), type: "character-match" });
    }
    // Remaining characters are plain text
    queryMatches.push({ text: name.substring(lastIndex) });
    return queryMatches;
}
exports.highlightMatches = highlightMatches;
//# sourceMappingURL=utils.js.map