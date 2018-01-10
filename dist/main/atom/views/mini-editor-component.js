"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
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
        if (props.readOnly) {
            this.element.removeAttribute("tabindex"); // make read-only
        }
        if (props.grammar) {
            const grammar = atom.grammars.grammarForScopeName(props.grammar);
            if (grammar) {
                this.model.setGrammar(grammar);
            }
        }
        this.model.scrollToBufferPosition([0, 0]);
    }
    update(props) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.element = atom.views.getView(this.model);
            if (this.props.readOnly !== props.readOnly) {
                this.props.readOnly = props.readOnly;
                if (props.readOnly) {
                    this.element.removeAttribute("tabindex"); // make read-only
                }
                else {
                    this.element.setAttribute("tabindex", "-1");
                }
            }
            if (props.grammar && this.props.grammar !== props.grammar) {
                this.props.readOnly = props.readOnly;
                const grammar = atom.grammars.grammarForScopeName(props.grammar);
                if (grammar) {
                    this.model.setGrammar(grammar);
                }
            }
        });
    }
    focus() {
        this.element.focus();
    }
    getModel() {
        return this.model;
    }
}
exports.MiniEditor = MiniEditor;
//# sourceMappingURL=mini-editor-component.js.map