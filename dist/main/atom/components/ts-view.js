"use strict";
class TsView extends HTMLElement {
    createdCallback() {
        var preview = this.innerText;
        this.innerText = "";
        var editorElement = this.editorElement = document.createElement('atom-text-editor');
        editorElement.setAttributeNode(document.createAttribute('gutter-hidden'));
        editorElement.removeAttribute('tabindex');
        var editor = this.editor = editorElement.getModel();
        editor.getDecorations({ class: 'cursor-line', type: 'line' })[0].destroy();
        editor.setText(preview);
        var grammar = atom.grammars.grammarForScopeName("source.tsx");
        editor.setGrammar(grammar);
        editor.setSoftWrapped(true);
        this.appendChild(editorElement);
    }
    text(text) {
        this.editor.setText(text);
    }
}
exports.TsView = TsView;
document.registerElement('ts-view', TsView);
