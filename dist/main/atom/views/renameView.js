"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const view = require("./view");
var $ = view.$;
var html = require('../../../../views/renameView.html');
class RenameView extends view.View {
    init() {
        $(atom.views.getView(atom.workspace)).on('keydown', (e) => {
            if (e.keyCode == 27) {
                if (this.options.onCancel) {
                    this.options.onCancel();
                    this.clearView();
                }
            }
        });
        this.newNameEditor.on('keydown', (e) => {
            var newText = this.newNameEditor.model.getText();
            if (e.keyCode == 13) {
                var invalid = this.options.onValidate(newText);
                if (invalid) {
                    this.validationMessage.text(invalid);
                    this.validationMessage.show();
                    return;
                }
                this.validationMessage.hide();
                if (this.options.onCommit) {
                    this.options.onCommit(newText);
                    this.clearView();
                }
            }
            if (e.keyCode == 27) {
                if (this.options.onCancel) {
                    this.options.onCancel();
                    this.clearView();
                }
            }
        });
    }
    setPanel(panel) {
        this.panel = panel;
    }
    clearView() {
        if (this.editorAtRenameStart && !this.editorAtRenameStart.isDestroyed()) {
            var view = atom.views.getView(this.editorAtRenameStart);
            view.focus();
        }
        this.panel.hide();
        this.options = {};
        this.editorAtRenameStart = undefined;
    }
    renameThis(options) {
        this.options = options;
        this.editorAtRenameStart = atom.workspace.getActiveTextEditor();
        this.panel.show();
        this.newNameEditor.model.setText(options.text);
        if (this.options.autoSelect) {
            this.newNameEditor.model.selectAll();
        }
        else {
            this.newNameEditor.model.moveCursorToEndOfScreenLine();
        }
        this.title.text(this.options.title);
        this.newNameEditor.focus();
        this.validationMessage.hide();
    }
    // Show the dialog and resolve the promise with the entered string
    showRenameDialog(options) {
        return new Promise((resolve, reject) => {
            this.renameThis(Object.assign({}, options, { onCancel: reject, onCommit: resolve }));
        });
    }
}
RenameView.content = html;
exports.RenameView = RenameView;
function attach() {
    const renameView = new RenameView({});
    const panel = atom.workspace.addModalPanel({
        item: renameView,
        priority: 1000,
        visible: false
    });
    renameView.setPanel(panel);
    return {
        dispose() {
            console.log("TODO: Detach the rename view: ", panel);
        },
        renameView
    };
}
exports.attach = attach;
//# sourceMappingURL=renameView.js.map