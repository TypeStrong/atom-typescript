"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function setupEditor(editor) {
    var editorView = atom.views.getView(editor);
    editorView.classList.add('typescript-editor');
    editor.onDidDestroy(function () {
        editorView.classList.remove('typescript-editor');
    });
}
exports.setupEditor = setupEditor;
