"use strict";
const tslib_1 = require("tslib");
const sp = require("atom-space-pen-views");
const mainPanelView = require("./mainPanelView");
var titles = {
    togglePanel: 'Toggle TypeScript Panel',
    tabErrors: 'Tab: Errors in Open Files',
    tabLastBuild: 'Tab: Last Build Output',
    tabReferences: 'Tab: Find References',
};
var items = Object.keys(titles).map(item => { return { title: titles[item] }; });
class ContextView extends sp.SelectListView {
    constructor() {
        super(...arguments);
        this.panel = null;
    }
    get $() {
        return this;
    }
    setItems(items) { super.setItems(items); }
    viewForItem(item) {
        return `<li>${item.title}</li>`;
    }
    confirmed(item) {
        if (item.title == titles.togglePanel) {
            mainPanelView.panelView.toggle();
        }
        if (item.title == titles.tabLastBuild) {
            mainPanelView.panelView.buildPanelSelected();
        }
        if (item.title == titles.tabReferences) {
            mainPanelView.panelView.referencesPanelSelected();
        }
        this.hide();
    }
    getFilterKey() { return 'title'; }
    show() {
        this.storeFocusedElement();
        if (!this.panel)
            this.panel = atom.workspace.addModalPanel({ item: this });
        this.panel.show();
        this.setItems(items);
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
exports.ContextView = ContextView;
