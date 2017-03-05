"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var view = require("./view");
var $ = view.$;
var AwesomePanelView = (function (_super) {
    __extends(AwesomePanelView, _super);
    function AwesomePanelView() {
        return _super !== null && _super.apply(this, arguments) || this;
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
