"use strict";
const sp = require("atom-space-pen-views");
const atomUtils = require("../atomUtils");
class FileSymbolsView extends sp.SelectListView {
    constructor() {
        super(...arguments);
        this.panel = null;
    }
    get $() {
        return this;
    }
    setNavBarItems(tsItems, filePath) {
        var items = tsItems;
        this.filePath = filePath;
        super.setItems(items);
    }
    viewForItem(item) {
        return `
            <li>
                <div class="highlight">${Array(item.indent * 2).join('&nbsp;') + (item.indent ? "\u221F " : '') + item.text}</div>
                <div class="pull-right" style="font-weight: bold; color:${atomUtils.kindToColor(item.kind)}">${item.kind}</div>
                <div class="clear"> line: ${item.position.line + 1}</div>
            </li>
        `;
    }
    confirmed(item) {
        atom.workspace.open(this.filePath, {
            initialLine: item.position.line,
            initialColumn: item.position.col
        });
        this.hide();
    }
    getFilterKey() { return 'text'; }
    show() {
        this.storeFocusedElement();
        if (!this.panel)
            this.panel = atom.workspace.addModalPanel({ item: this });
        this.panel.show();
        this.focusFilterEditor();
    }
    hide() {
        this.panel.hide();
        this.restoreFocus();
    }
    cancelled() {
        this.hide();
    }
}
exports.FileSymbolsView = FileSymbolsView;
