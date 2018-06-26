"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
// Return line/offset position in the editor using 1-indexed coordinates
function getEditorPosition(editor) {
    const pos = editor.getCursorBufferPosition();
    return {
        line: pos.row + 1,
        offset: pos.column + 1,
    };
}
function isTypescriptFile(filePath) {
    if (filePath === undefined)
        return false;
    return isAllowedExtension(path.extname(filePath));
}
exports.isTypescriptFile = isTypescriptFile;
function typeScriptScopes() {
    return ["source.ts", "source.tsx", "typescript"];
}
exports.typeScriptScopes = typeScriptScopes;
function isTypescriptEditorWithPath(editor) {
    return isTypescriptFile(editor.getPath()) && isTypescriptGrammar(editor);
}
exports.isTypescriptEditorWithPath = isTypescriptEditorWithPath;
function isTypescriptGrammar(editor) {
    const [scopeName] = editor.getRootScopeDescriptor().getScopesArray();
    return typeScriptScopes().includes(scopeName);
}
exports.isTypescriptGrammar = isTypescriptGrammar;
function isAllowedExtension(ext) {
    return [".ts", ".tst", ".tsx"].includes(ext);
}
function getFilePathPosition(editor) {
    const file = editor.getPath();
    if (file !== undefined) {
        return Object.assign({ file }, getEditorPosition(editor));
    }
}
exports.getFilePathPosition = getFilePathPosition;
//# sourceMappingURL=atom.js.map