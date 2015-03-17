var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
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
            if (e.keyCode == 13) {
                if (_this.options.onCommit) {
                    _this.options.onCommit(_this.newNameEditor.model.getText());
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
        this.editorAtRenameStart = atom.workspace.getActiveEditor();
        panel.show();
        this.newNameEditor.model.setText(options.text);
        this.newNameEditor.model.selectAll();
        this.newNameEditor.focus();
    };
    RenameView.content = html;
    return RenameView;
})(view.View);
exports.RenameView = RenameView;
exports.panelView;
var panel;
function attach() {
    exports.panelView = new RenameView();
    panel = atom.workspace.addModalPanel({
        item: exports.panelView,
        priority: 1000,
        visible: false
    });
}
exports.attach = attach;
//# sourceMappingURL=renameView.js.map