"use strict";
const view = require("./view");
var $ = view.$;
var html = require('../../../../views/renameView.html');
class RenameView extends view.View {
    constructor() {
        super(...arguments);
        this.editorAtRenameStart = null;
    }
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
    clearView() {
        if (this.editorAtRenameStart && !this.editorAtRenameStart.isDestroyed()) {
            var view = atom.views.getView(this.editorAtRenameStart);
            view.focus();
        }
        panel.hide();
        this.options = {};
        this.editorAtRenameStart = null;
    }
    renameThis(options) {
        this.options = options;
        this.editorAtRenameStart = atom.workspace.getActiveTextEditor();
        panel.show();
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
        this.fileCount.html(`<div>
            Files Counts: <span class='highlight'> Already Open ( ${options.openFiles.length} )</span> and <span class='highlight'> Currently Closed ( ${options.closedFiles.length} ) </span>
        </div>`);
    }
}
RenameView.content = html;
exports.RenameView = RenameView;
var panel;
function attach() {
    exports.panelView = new RenameView({});
    panel = atom.workspace.addModalPanel({ item: exports.panelView, priority: 1000, visible: false });
}
exports.attach = attach;
