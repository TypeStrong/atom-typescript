"use strict";
var tslib_1 = require("tslib");
var TsView = (function (_super) {
    tslib_1.__extends(TsView, _super);
    function TsView() {
        return _super.apply(this, arguments) || this;
    }
    TsView.prototype.createdCallback = function () {
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
    };
    TsView.prototype.text = function (text) {
        this.editor.setText(text);
    };
    return TsView;
}(HTMLElement));
exports.TsView = TsView;
document.registerElement('ts-view', TsView);
