var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var sp = require('atom-space-pen-views');
var atomUtils = require("../atomUtils");
var ProjectSymbolsView = (function (_super) {
    __extends(ProjectSymbolsView, _super);
    function ProjectSymbolsView() {
        _super.apply(this, arguments);
        this.panel = null;
    }
    Object.defineProperty(ProjectSymbolsView.prototype, "$", {
        get: function () {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ProjectSymbolsView.prototype, "filterView", {
        get: function () {
            return {
                $: this.filterEditorView,
                model: this.filterEditorView.model
            };
        },
        enumerable: true,
        configurable: true
    });
    ProjectSymbolsView.prototype.setNavBarItems = function (tsItems) {
        _super.prototype.setMaxItems.call(this, 40);
        var items = tsItems;
        _super.prototype.setItems.call(this, items);
    };
    ProjectSymbolsView.prototype.viewForItem = function (item) {
        return "\n            <li>\n                <div class=\"highlight\">" + item.name + "</div>\n                <div class=\"pull-right\" style=\"font-weight: bold; color:" + atomUtils.kindToColor(item.kind) + "\">" + item.kind + "</div>\n                <div class=\"clear\">" + item.fileName + " : " + (item.position.line + 1) + "</div>\n            </li>\n        ";
    };
    ProjectSymbolsView.prototype.confirmed = function (item) {
        atom.workspace.open(item.filePath, {
            initialLine: item.position.line,
            initialColumn: item.position.col
        });
        this.hide();
    };
    ProjectSymbolsView.prototype.getFilterKey = function () { return 'name'; };
    ProjectSymbolsView.prototype.show = function () {
        this.storeFocusedElement();
        if (!this.panel)
            this.panel = atom.workspace.addModalPanel({ item: this });
        this.panel.show();
        this.focusFilterEditor();
    };
    ProjectSymbolsView.prototype.hide = function () {
        this.panel.hide();
        this.restoreFocus();
    };
    ProjectSymbolsView.prototype.cancelled = function () {
        this.hide();
    };
    return ProjectSymbolsView;
})(sp.SelectListView);
exports.ProjectSymbolsView = ProjectSymbolsView;
