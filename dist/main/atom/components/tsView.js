// Some docs
// http://www.html5rocks.com/en/tutorials/webcomponents/customelements/ (look at lifecycle callback methods)
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TsView extends HTMLElement {
    createdCallback() {
        var preview = this.innerText;
        this.innerText = "";
        // Based on markdown editor
        // https://github.com/atom/markdown-preview/blob/2bcbadac3980f1aeb455f7078bd1fdfb4e6fe6b1/lib/renderer.coffee#L111
        var editorElement = this.editorElement = document.createElement('atom-text-editor');
        editorElement.setAttributeNode(document.createAttribute('gutter-hidden'));
        editorElement.removeAttribute('tabindex'); // make read-only
        var editor = this.editor = editorElement.getModel();
        editor.getDecorations({ class: 'cursor-line', type: 'line' })[0].destroy(); // remove the default selection of a line in each editor
        editor.setText(preview);
        var grammar = atom.grammars.grammarForScopeName("source.tsx");
        editor.setGrammar(grammar);
        editor.setSoftWrapped(true);
        this.appendChild(editorElement);
    }
    // API
    text(text) {
        this.editor.setText(text);
    }
}
exports.TsView = TsView;
document.registerElement('ts-view', TsView);
//# sourceMappingURL=tsView.js.map