"use strict";
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
const sp = require("atom-space-pen-views");
var $ = sp.$;
class SimpleSelectListView extends sp.SelectListView {
    constructor(options) {
        super();
        this.options = options;
        this.panel = null;
    }
    get $() {
        return this;
    }
    setItems() {
        super.setItems(this.options.items);
    }
    viewForItem(item) {
        var view = this.options.viewForItem(item);
        if (typeof view === "string") {
            return `<li>
                ${view}
            </li>`;
        }
        else {
            return $('<li></li>').append(view);
        }
        ;
    }
    confirmed(item) {
        this.options.confirmed(item);
        this.hide();
    }
    getFilterKey() {
        return this.options.filterKey;
    }
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
exports.SimpleSelectListView = SimpleSelectListView;
