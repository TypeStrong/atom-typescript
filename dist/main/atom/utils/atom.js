"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Atom = require("atom");
const path = require("path");
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
    if (filePath === undefined)
        return false;
    return isAllowedExtension(path.extname(filePath));
}
exports.isTypescriptFile = isTypescriptFile;
function typeScriptScopes() {
    const tsScopes = atom.config.get("atom-typescript").tsSyntaxScopes;
    if (atom.config.get("atom-typescript").allowJS) {
        tsScopes.push(...atom.config.get("atom-typescript").jsSyntaxScopes);
    }
    return tsScopes;
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
    const tsExts = atom.config.get("atom-typescript").tsFileExtensions;
    if (atom.config.get("atom-typescript").allowJS) {
        tsExts.push(...atom.config.get("atom-typescript").jsFileExtensions);
    }
    return tsExts.includes(ext);
}
function getFilePathPosition(editor, position) {
    const file = editor.getPath();
    if (file !== undefined) {
        const location = position ? ts_1.pointToLocation(position) : getEditorPosition(editor);
        return Object.assign({ file }, location);
    }
}
exports.getFilePathPosition = getFilePathPosition;
function* getOpenEditorsPaths() {
    for (const ed of atom.workspace.getTextEditors()) {
        if (isTypescriptEditorWithPath(ed))
            yield ed.getPath();
    }
}
exports.getOpenEditorsPaths = getOpenEditorsPaths;
async function highlight(code, scopeName) {
    const ed = new Atom.TextEditor({
        readonly: true,
        keyboardInputEnabled: false,
        showInvisibles: false,
        tabLength: atom.config.get("editor.tabLength"),
    });
    const el = atom.views.getView(ed);
    try {
        el.setUpdatedSynchronously(true);
        el.style.pointerEvents = "none";
        el.style.position = "absolute";
        el.style.top = "100vh";
        el.style.width = "100vw";
        atom.grammars.assignLanguageMode(ed.getBuffer(), scopeName);
        ed.setText(code);
        ed.scrollToBufferPosition(ed.getBuffer().getEndPosition());
        atom.views.getView(atom.workspace).appendChild(el);
        await editorTokenized(ed);
        return Array.from(el.querySelectorAll(".line:not(.dummy)")).map(x => x.innerHTML);
    }
    finally {
        el.remove();
    }
}
exports.highlight = highlight;
async function editorTokenized(editor) {
    return new Promise(resolve => {
        const languageMode = editor.getBuffer().getLanguageMode();
        const nextUpdatePromise = editor.component.getNextUpdatePromise();
        if (languageMode.fullyTokenized || languageMode.tree) {
            resolve(nextUpdatePromise);
        }
        else {
            const disp = editor.onDidTokenize(() => {
                disp.dispose();
                resolve(nextUpdatePromise);
            });
        }
    });
}
//# sourceMappingURL=atom.js.map