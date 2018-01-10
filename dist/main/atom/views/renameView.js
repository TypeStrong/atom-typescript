"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const etch = require("etch");
const atom_1 = require("atom");
const mini_editor_component_1 = require("./mini-editor-component");
class RenameView {
    constructor(props) {
        this.props = props;
        etch.initialize(this);
    }
    update(props) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.props.validationMessage = props.validationMessage;
            if (props.title)
                this.props.title = props.title;
            yield etch.update(this);
        });
    }
    render() {
        let validationMessage = null;
        if (this.props.validationMessage) {
            validationMessage = etch.dom("div", { class: "highlight-error" }, this.props.validationMessage);
        }
        return (etch.dom("div", { tabIndex: "-1", class: "atomts-rename-view", ref: "main" },
            etch.dom("div", { class: "block" },
                etch.dom("div", null,
                    etch.dom("span", { ref: "title" }, this.props.title),
                    etch.dom("span", { class: "subtle-info-message" },
                        etch.dom("span", null, "Close this panel with "),
                        etch.dom("span", { class: "highlight" }, "esc"),
                        etch.dom("span", null, " key. And commit with the "),
                        etch.dom("span", { class: "highlight" }, "enter"),
                        etch.dom("span", null, " key."))),
                etch.dom("div", { class: "find-container block" },
                    etch.dom("div", { class: "editor-container" },
                        etch.dom(mini_editor_component_1.MiniEditor, { ref: "editor", initialText: this.props.initialText, selectAll: this.props.selectAll }))),
                validationMessage)));
    }
    destroy() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield etch.destroy(this);
        });
    }
    focus() {
        return this.refs.editor.focus();
    }
    getText() {
        return this.refs.editor.getModel().getText();
    }
}
// Show the dialog and resolve the promise with the entered string
function showRenameDialog(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const item = new RenameView({
            title: options.title,
            initialText: options.text,
            selectAll: options.autoSelect,
        });
        const panel = atom.workspace.addModalPanel({
            item,
            priority: 1000,
        });
        const currentFocus = document.activeElement;
        item.focus();
        const disposables = new atom_1.CompositeDisposable();
        try {
            return yield new Promise((resolve, reject) => {
                disposables.add(atom.commands.add(item.refs.main, {
                    "core:cancel": () => {
                        reject();
                    },
                    "core:confirm": () => {
                        const newText = item.getText();
                        const invalid = options.onValidate && options.onValidate(newText);
                        if (invalid) {
                            item.update({ validationMessage: invalid });
                            return;
                        }
                        resolve(newText);
                    },
                }));
            });
        }
        finally {
            panel.destroy();
            disposables.dispose();
            if (currentFocus)
                currentFocus.focus();
        }
    });
}
exports.showRenameDialog = showRenameDialog;
//# sourceMappingURL=renameView.js.map