"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MiniEditor {
    constructor(props) {
        this.props = props;
        this.model = atom.workspace.buildTextEditor({
            mini: true,
            softWrapped: true,
            lineNumberGutterVisible: false,
        });
        this.element = atom.views.getView(this.model);
        this.model.setText(props.initialText);
        if (props.selectAll) {
            this.model.selectAll();
        }
        else {
            this.model.getLastCursor().moveToEndOfScreenLine();
        }
        this.setReadOnly();
        this.setGrammar();
        this.model.scrollToBufferPosition([0, 0]);
    }
    async update(props) {
        this.element = atom.views.getView(this.model);
        this.props = Object.assign({}, this.props, props);
        this.setReadOnly();
        this.setGrammar();
    }
    focus() {
        this.element.focus();
    }
    getModel() {
        return this.model;
    }
    setReadOnly() {
        this.model.setReadOnly(!!this.props.readOnly);
    }
    setGrammar() {
        if (this.props.grammar !== undefined) {
            atom.textEditors.setGrammarOverride(this.model, this.props.grammar);
        }
        else {
            atom.textEditors.clearGrammarOverride(this.model);
        }
    }
}
exports.MiniEditor = MiniEditor;
//# sourceMappingURL=miniEditor.js.map