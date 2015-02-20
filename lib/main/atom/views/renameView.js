var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var view = require('./view');
var $ = view.$;
var RenameView = (function (_super) {
    __extends(RenameView, _super);
    function RenameView(options) {
        _super.call(this);
    }
    RenameView.content = function () {
        var _this = this;
        return this.div({ class: 'awesome' }, function () { return _this.div({ class: 'dude', outlet: 'something' }); });
    };
    RenameView.prototype.initialize = function () {
        this.something.html('<div>tada</div>');
    };
    return RenameView;
})(view.View);
exports.RenameView = RenameView;
exports.panelView;
exports.panel;
function attach() {
    exports.panelView = new RenameView();
    exports.panel = atom.workspace.addModalPanel({ item: exports.panelView, priority: 1000, visible: false });
}
exports.attach = attach;
