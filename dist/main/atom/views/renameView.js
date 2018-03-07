"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
const atom_1 = require("atom");
const miniEditor_1 = require("../components/miniEditor");
class RenameView {
    constructor(props) {
        this.props = props;
        etch.initialize(this);
    }
    async update(props) {
        this.props = Object.assign({}, this.props, props);
        await etch.update(this);
    }
    render() {
        return (etch.dom("div", { class: "atomts-rename-view", ref: "main" },
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
                        etch.dom(miniEditor_1.MiniEditor, { ref: "editor", initialText: this.props.initialText, selectAll: this.props.selectAll }))),
                this.renderValidationMessage())));
    }
    async destroy() {
        await etch.destroy(this);
    }
    focus() {
        return this.refs.editor.focus();
    }
    getText() {
        return this.refs.editor.getModel().getText();
    }
    renderValidationMessage() {
        if (this.props.validationMessage !== undefined) {
            return etch.dom("div", { class: "highlight-error" }, this.props.validationMessage);
        }
        return null;
    }
}
// Show the dialog and resolve the promise with the entered string
async function showRenameDialog(options) {
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
        return await new Promise(resolve => {
            disposables.add(atom.commands.add(item.refs.main, {
                "core:cancel": () => {
                    resolve(undefined);
                },
                "core:confirm": () => {
                    const newText = item.getText();
                    const invalid = options.onValidate(newText);
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
}
exports.showRenameDialog = showRenameDialog;
//# sourceMappingURL=renameView.js.map