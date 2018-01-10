"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const etch = require("etch");
const mini_editor_component_1 = require("../views/mini-editor-component");
class TsView {
    constructor(props) {
        this.props = props;
        etch.initialize(this);
    }
    render() {
        return etch.dom(mini_editor_component_1.MiniEditor, { ref: "editor", initialText: this.props.text, grammar: "source.tsx", readOnly: true });
    }
    update(props) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.props.text !== props.text) {
                this.props.text = props.text;
                this.refs.editor.getModel().setText(props.text);
            }
        });
    }
}
exports.TsView = TsView;
//# sourceMappingURL=tsView.js.map