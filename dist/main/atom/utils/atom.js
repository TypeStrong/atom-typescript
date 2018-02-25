"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs_1 = require("./fs");
const ts_1 = require("./ts");
// Return line/offset position in the editor using 1-indexed coordinates
function getEditorPosition(editor) {
    const pos = editor.getCursorBufferPosition();
    return {
        line: pos.row + 1,
        offset: pos.column + 1,
    };
}
function isTypescriptFile(filePath) {
    if (!filePath) {
        return false;
    }
    const ext = path.extname(filePath);
    return ext === ".ts" || ext === ".tsx";
}
exports.isTypescriptFile = isTypescriptFile;
function onDiskAndTs(editor) {
    if (editor instanceof require("atom").TextEditor) {
        const filePath = editor.getPath();
        if (!filePath) {
            return false;
        }
        const ext = path.extname(filePath);
        if (isAllowedExtension(ext)) {
            // if (fs.existsSync(filePath)) {
            return true;
            // }
        }
    }
    return false;
}
exports.onDiskAndTs = onDiskAndTs;
function isTypescriptGrammar(editor) {
    const [scopeName] = editor.getRootScopeDescriptor().getScopesArray();
    return scopeName === "source.ts" || scopeName === "source.tsx";
}
exports.isTypescriptGrammar = isTypescriptGrammar;
function isAllowedExtension(ext) {
    return ext === ".ts" || ext === ".tst" || ext === ".tsx";
}
exports.isAllowedExtension = isAllowedExtension;
function getFilePathPosition() {
    const editor = atom.workspace.getActiveTextEditor();
    if (editor) {
        const file = editor.getPath();
        if (file) {
            return Object.assign({ file }, getEditorPosition(editor));
        }
    }
}
exports.getFilePathPosition = getFilePathPosition;
function formatCode(editor, edits) {
    // The code edits need to be applied in reverse order
    for (let i = edits.length - 1; i >= 0; i--) {
        editor.setTextInBufferRange(ts_1.spanToRange(edits[i]), edits[i].newText);
    }
}
exports.formatCode = formatCode;
/** See types :
 * https://github.com/atom-community/autocomplete-plus/pull/334#issuecomment-85697409
 */
function kindToType(kind) {
    // variable, constant, property, value, method, function, class, type, keyword, tag, snippet, import, require
    switch (kind) {
        case "const":
            return "constant";
        case "interface":
            return "type";
        case "identifier":
            return "variable";
        case "local function":
            return "function";
        case "local var":
            return "variable";
        case "let":
        case "var":
        case "parameter":
            return "variable";
        case "alias":
            return "import";
        case "type parameter":
            return "type";
        default:
            return kind.split(" ")[0];
    }
}
exports.kindToType = kindToType;
/** Utility functions for commands */
function commandForTypeScript(e) {
    const editor = atom.workspace.getActiveTextEditor();
    if (!editor) {
        return e.abortKeyBinding() && false;
    }
    const filePath = editor.getPath();
    if (!filePath) {
        return e.abortKeyBinding() && false;
    }
    const ext = path.extname(filePath);
    if (!isAllowedExtension(ext)) {
        return e.abortKeyBinding() && false;
    }
    return true;
}
exports.commandForTypeScript = commandForTypeScript;
/**
 * converts "c:\dev\somethin\bar.ts" to "~something\bar".
 */
function getFilePathRelativeToAtomProject(filePath) {
    filePath = fs_1.consistentPath(filePath);
    // Sample:
    // atom.project.relativize(`D:/REPOS/atom-typescript/lib/main/atom/atomUtils.ts`)
    return "~" + atom.project.relativize(filePath);
}
exports.getFilePathRelativeToAtomProject = getFilePathRelativeToAtomProject;
/**
 * Opens the given file in the same project
 */
function openFile(filePath, position = {}) {
    const config = {};
    if (position.line) {
        config.initialLine = position.line - 1;
    }
    if (position.col) {
        config.initialColumn = position.col;
    }
    atom.workspace.open(filePath, config);
}
exports.openFile = openFile;
//# sourceMappingURL=atom.js.map