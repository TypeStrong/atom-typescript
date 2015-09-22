var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var TsView = (function (_super) {
    __extends(TsView, _super);
    function TsView() {
        _super.apply(this, arguments);
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
        var grammar = atom.grammars.grammarForScopeName("source.ts");
        editor.setGrammar(grammar);
        editor.setSoftWrapped(true);
        this.appendChild(editorElement);
    };
    TsView.prototype.text = function (text) {
        this.editor.setText(text);
    };
    return TsView;
})(HTMLElement);
exports.TsView = TsView;
document.registerElement('ts-view', TsView);
