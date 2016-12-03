"use strict";
const sp = require("atom-space-pen-views");
const atomUtils = require("../atomUtils");
class ProjectSymbolsView extends sp.SelectListView {
    constructor() {
        super(...arguments);
        this.panel = null;
    }
    get $() {
        return this;
    }
    get filterView() {
        return {
            $: this.filterEditorView,
            model: this.filterEditorView.model
        };
    }
    setNavBarItems(tsItems) {
        super.setMaxItems(40);
        var items = tsItems;
        super.setItems(items);
    }
    viewForItem(item) {
        return `
            <li>
                <div class="highlight">${item.name}</div>
                <div class="pull-right" style="font-weight: bold; color:${atomUtils.kindToColor(item.kind)}">${item.kind}</div>
                <div class="clear">${item.fileName} : ${item.position.line + 1}</div>
            </li>
        `;
    }
    confirmed(item) {
        atom.workspace.open(item.filePath, {
            initialLine: item.position.line,
            initialColumn: item.position.col
        });
        this.hide();
    }
    getFilterKey() { return 'name'; }
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
exports.ProjectSymbolsView = ProjectSymbolsView;
