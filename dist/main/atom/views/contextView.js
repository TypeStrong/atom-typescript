var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var sp = require('atom-space-pen-views');
var items = [{ title: 'Toggle TypeScript Panel' }, { title: 'Tab: Errors in Open Files' }, { title: 'Tab: Last Build Output' }];
var ContextView = (function (_super) {
    __extends(ContextView, _super);
    function ContextView() {
        _super.apply(this, arguments);
        this.panel = null;
    }
    Object.defineProperty(ContextView.prototype, "$", {
        get: function () {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    ContextView.prototype.setItems = function (items) { _super.prototype.setItems.call(this, items); };
    ContextView.prototype.viewForItem = function (item) {
        return "<li>" + item.title + "</li>";
    };
    ContextView.prototype.confirmed = function (item) {
        console.log(item);
        this.hide();
    };
    ContextView.prototype.getFilterKey = function () { return 'title'; };
    ContextView.prototype.show = function () {
        this.storeFocusedElement();
        if (!this.panel)
            this.panel = atom.workspace.addModalPanel({ item: this });
        this.panel.show();
        this.setItems(items);
        this.focusFilterEditor();
    };
    ContextView.prototype.hide = function () {
        this.panel.hide();
        this.restoreFocus();
    };
    ContextView.prototype.cancelled = function () {
        this.hide();
    };
    return ContextView;
})(sp.SelectListView);
exports.ContextView = ContextView;
//# sourceMappingURL=contextView.js.map