var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var sp = require('atom-space-pen-views');
var mainPanelView = require('./mainPanelView');
var semanticView = require("./semanticView");
var titles = {
    togglePanel: 'Toggle TypeScript Panel',
    tabErrors: 'Tab: Errors in Open Files',
    tabLastBuild: 'Tab: Last Build Output',
    tabReferences: 'Tab: Find References',
    fileSemantics: 'Toggle: File Semantics',
};
var items = Object.keys(titles).map(function (item) { return { title: titles[item] }; });
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
        if (item.title == titles.togglePanel) {
            mainPanelView.panelView.toggle();
        }
        if (item.title == titles.tabErrors) {
            mainPanelView.panelView.errorPanelSelected();
        }
        if (item.title == titles.tabLastBuild) {
            mainPanelView.panelView.buildPanelSelected();
        }
        if (item.title == titles.tabReferences) {
            mainPanelView.panelView.referencesPanelSelected();
        }
        if (item.title == titles.fileSemantics) {
            semanticView.toggle();
        }
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
