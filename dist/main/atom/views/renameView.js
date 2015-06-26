var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var view = require('./view');
var $ = view.$;
var html = require('../../../../views/renameView.html');
var RenameView = (function (_super) {
    __extends(RenameView, _super);
    function RenameView() {
        _super.apply(this, arguments);
        this.editorAtRenameStart = null;
    }
    RenameView.prototype.init = function () {
        var _this = this;
        $(atom.views.getView(atom.workspace)).on('keydown', function (e) {
            if (e.keyCode == 27) {
                if (_this.options.onCancel) {
                    _this.options.onCancel();
                    _this.clearView();
                }
            }
        });
        this.newNameEditor.on('keydown', function (e) {
            var newText = _this.newNameEditor.model.getText();
            if (e.keyCode == 13) {
                var invalid = _this.options.onValidate(newText);
                if (invalid) {
                    _this.validationMessage.text(invalid);
                    _this.validationMessage.show();
                    return;
                }
                _this.validationMessage.hide();
                if (_this.options.onCommit) {
                    _this.options.onCommit(newText);
                    _this.clearView();
                }
            }
            if (e.keyCode == 27) {
                if (_this.options.onCancel) {
                    _this.options.onCancel();
                    _this.clearView();
                }
            }
        });
    };
    RenameView.prototype.clearView = function () {
        if (this.editorAtRenameStart && !this.editorAtRenameStart.isDestroyed()) {
            var view = atom.views.getView(this.editorAtRenameStart);
            view.focus();
        }
        panel.hide();
        this.options = {};
        this.editorAtRenameStart = null;
    };
    RenameView.prototype.renameThis = function (options) {
        this.options = options;
        this.editorAtRenameStart = atom.workspace.getActiveTextEditor();
        panel.show();
        this.newNameEditor.model.setText(options.text);
        if (this.options.autoSelect) {
            this.newNameEditor.model.selectAll();
        }
        else {
            this.newNameEditor.model.moveToEndOfScreenLine();
        }
        this.title.text(this.options.title);
        this.newNameEditor.focus();
        this.validationMessage.hide();
        this.fileCount.html("<div>\n            Files Counts: <span class='highlight'> Already Open ( " + options.openFiles.length + " )</span> and <span class='highlight'> Currently Closed ( " + options.closedFiles.length + " ) </span>\n        </div>");
    };
    RenameView.content = html;
    return RenameView;
})(view.View);
exports.RenameView = RenameView;
var panel;
function attach() {
    exports.panelView = new RenameView({});
    panel = atom.workspace.addModalPanel({ item: exports.panelView, priority: 1000, visible: false });
}
exports.attach = attach;
