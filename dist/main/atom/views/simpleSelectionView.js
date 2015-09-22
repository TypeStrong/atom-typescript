var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var singleton;
function simpleSelectionView(options) {
    if (!singleton)
        singleton = new SimpleSelectListView(options);
    else {
        singleton.options = options;
    }
    singleton.setItems();
    singleton.show();
    return singleton;
}
exports.simpleSelectionView = simpleSelectionView;
var sp = require('atom-space-pen-views');
var $ = sp.$;
var SimpleSelectListView = (function (_super) {
    __extends(SimpleSelectListView, _super);
    function SimpleSelectListView(options) {
        _super.call(this);
        this.options = options;
        this.panel = null;
    }
    Object.defineProperty(SimpleSelectListView.prototype, "$", {
        get: function () {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    SimpleSelectListView.prototype.setItems = function () {
        _super.prototype.setItems.call(this, this.options.items);
    };
    SimpleSelectListView.prototype.viewForItem = function (item) {
        var view = this.options.viewForItem(item);
        if (typeof view === "string") {
            return "<li>\n                " + view + "\n            </li>";
        }
        else {
            return $('<li></li>').append(view);
        }
        ;
    };
    SimpleSelectListView.prototype.confirmed = function (item) {
        this.options.confirmed(item);
        this.hide();
    };
    SimpleSelectListView.prototype.getFilterKey = function () {
        return this.options.filterKey;
    };
    SimpleSelectListView.prototype.show = function () {
        this.storeFocusedElement();
        if (!this.panel)
            this.panel = atom.workspace.addModalPanel({ item: this });
        this.panel.show();
        this.focusFilterEditor();
    };
    SimpleSelectListView.prototype.hide = function () {
        this.panel.hide();
        this.restoreFocus();
    };
    SimpleSelectListView.prototype.cancelled = function () {
        this.hide();
    };
    return SimpleSelectListView;
})(sp.SelectListView);
exports.SimpleSelectListView = SimpleSelectListView;
