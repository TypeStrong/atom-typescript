"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
class MiniEditor {
    constructor(props) {
        this.props = props;
        this.model = atom.workspace.buildTextEditor({
            mini: true,
        });
        this.element = atom.views.getView(this.model);
        this.model.setText(props.initialText);
        if (props.selectAll) {
            this.model.selectAll();
        }
        else {
            this.model.getLastCursor().moveToEndOfScreenLine();
        }
    }
    update() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.element = atom.views.getView(this.model);
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