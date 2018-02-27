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
    if (!filePath)
        return false;
    return isAllowedExtension(path.extname(filePath));
}
exports.isTypescriptFile = isTypescriptFile;
function isTypescriptEditorWithPath(editor) {
    return isTypescriptFile(editor.getPath()) && isTypescriptGrammar(editor);
}
exports.isTypescriptEditorWithPath = isTypescriptEditorWithPath;
function isTypescriptGrammar(editor) {
    const [scopeName] = editor.getRootScopeDescriptor().getScopesArray();
    return ["source.ts", "source.tsx"].includes(scopeName);
}
function isAllowedExtension(ext) {
    return [".ts", ".tst", ".tsx"].includes(ext);
}
function getFilePathPosition(editor) {
    const file = editor.getPath();
    if (file) {
        return Object.assign({ file }, getEditorPosition(editor));
    }
}
exports.getFilePathPosition = getFilePathPosition;
/** Utility functions for commands */
function commandForTypeScript(e) {
    const editor = e.currentTarget.getModel();
    if (isTypescriptEditorWithPath(editor)) {
        return true;
    }
    else {
        e.abortKeyBinding();
        return false;
    }
}
exports.commandForTypeScript = commandForTypeScript;
//# sourceMappingURL=atom.js.map