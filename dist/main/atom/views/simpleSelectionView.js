/**
 * A functional form of the SelectListView
 * Only one of these bad boys is allowed on the screen at one time
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
/**
 * Various Utility section
 */
const sp = require("atom-space-pen-views");
var $ = sp.$;
class SimpleSelectListView extends sp.SelectListView {
    constructor(options) {
        super();
        this.options = options;
    }
    get $() {
        return this;
    }
    setItems() {
        super.setItems(this.options.items);
    }
    /** override */
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
    /** override */
    confirmed(item) {
        this.options.confirmed(item);
        this.hide();
    }
    /** override */
    getFilterKey() {
        return this.options.filterKey;
    }
    show() {
        this.storeFocusedElement();
        if (!this.panel)
            this.panel = atom.workspace.addModalPanel({ item: this });
        this.panel.show();
        this.focusFilterEditor();
        // debugger; // DEBUG: the UI in the inspector so that it doesn't change on you
    }
    hide() {
        if (this.panel) {
            this.panel.hide();
        }
        this.restoreFocus();
    }
    cancelled() {
        this.hide();
    }
}
exports.SimpleSelectListView = SimpleSelectListView;
//# sourceMappingURL=simpleSelectionView.js.map