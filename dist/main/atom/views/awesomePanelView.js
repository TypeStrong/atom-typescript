"use strict";
var tslib_1 = require("tslib");
var view = require("./view");
var $ = view.$;
var AwesomePanelView = (function (_super) {
    tslib_1.__extends(AwesomePanelView, _super);
    function AwesomePanelView() {
        return _super.apply(this, arguments) || this;
    }
    AwesomePanelView.content = function () {
        var _this = this;
        return this.div({ class: 'awesome' }, function () { return _this.div({ class: 'dude', outlet: 'something' }); });
    };
    AwesomePanelView.prototype.init = function () {
        this.something.html('<div>tada</div>');
    };
    return AwesomePanelView;
}(view.View));
exports.AwesomePanelView = AwesomePanelView;
function attach() {
    exports.panelView = new AwesomePanelView({});
    exports.panel = atom.workspace.addModalPanel({ item: exports.panelView, priority: 1000, visible: false });
}
exports.attach = attach;
