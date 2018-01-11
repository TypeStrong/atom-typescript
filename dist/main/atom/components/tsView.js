"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
const miniEditor_1 = require("./miniEditor");
class TsView {
    constructor(props) {
        this.props = props;
        etch.initialize(this);
    }
    render() {
        return etch.dom(miniEditor_1.MiniEditor, { ref: "editor", initialText: this.props.text, grammar: "source.tsx", readOnly: true });
    }
    async update(props) {
        if (this.props.text !== props.text) {
            this.props.text = props.text;
            this.refs.editor.getModel().setText(props.text);
        }
    }
}
exports.TsView = TsView;
//# sourceMappingURL=tsView.js.map