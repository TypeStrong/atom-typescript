var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var view = require('./view');
var $ = view.$;
var AwesomePanelView = (function (_super) {
    __extends(AwesomePanelView, _super);
    function AwesomePanelView() {
        _super.apply(this, arguments);
    }
    AwesomePanelView.content = function () {
        var _this = this;
        return this.div({ class: 'awesome' }, function () { return _this.div({ class: 'dude', outlet: 'something' }); });
    };
    AwesomePanelView.prototype.init = function () {
        this.something.html('<div>tada</div>');
    };
    return AwesomePanelView;
})(view.View);
exports.AwesomePanelView = AwesomePanelView;
function attach() {
    exports.panelView = new AwesomePanelView({});
    exports.panel = atom.workspace.addModalPanel({ item: exports.panelView, priority: 1000, visible: false });
}
exports.attach = attach;
