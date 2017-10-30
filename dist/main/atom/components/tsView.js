"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TsView extends HTMLElement {
    createdCallback() {
        const preview = this.innerText;
        this.innerText = "";
        this.editor = atom.workspace.buildTextEditor({
            lineNumberGutterVisible: false,
            softWrapped: true,
            mini: true,
        });
        const editorElement = atom.views.getView(this.editor);
        editorElement.removeAttribute("tabindex"); // make read-only
        this.editor.setText(preview);
        const grammar = atom.grammars.grammarForScopeName("source.tsx");
        if (grammar) {
            this.editor.setGrammar(grammar);
        }
        this.editor.scrollToBufferPosition([0, 0]);
        this.appendChild(editorElement);
    }
    // API
    text(text) {
        this.editor.setText(text);
    }
}
exports.TsView = TsView;
document.registerElement("ts-view", TsView);
//# sourceMappingURL=tsView.js.map