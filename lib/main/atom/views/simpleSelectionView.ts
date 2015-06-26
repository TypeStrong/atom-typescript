/**
 * A functional form of the SelectListView
 * Only one of these bad boys is allowed on the screen at one time
 */

export interface SelectListViewOptions<T> {
    items: T[];
    /** everything except the `li` which is required */
    viewForItem: (item: T) => string | JQuery;

    /** some property on item */
    filterKey: string;
    confirmed: (item: T) => any;
}

var singleton: SimpleSelectListView<any>;

export function simpleSelectionView<T>(options: SelectListViewOptions<T>): SimpleSelectListView<T> {
    if (!singleton) singleton = new SimpleSelectListView<T>(options);
    else { singleton.options = options; }

    singleton.setItems();
    singleton.show();
    return singleton;
}

/**
 * Various Utility section
 */

import sp = require('atom-space-pen-views');
import $ = sp.$;
import * as atomUtils from "../atomUtils";

export class SimpleSelectListView<T> extends sp.SelectListView {

    constructor(public options: SelectListViewOptions<T>) {
        super();
    }

    get $(): JQuery {
        return <any>this;
    }

    public setItems() {
        super.setItems(this.options.items)
    }

    /** override */
    viewForItem(item: T): any {
        var view = this.options.viewForItem(item);
        if (typeof view === "string") {
            return `<li>
                ${view}
            </li>`;
        }
        else {
            return $('<li></li>').append(view);
        };
    }
    
    /** override */
    confirmed(item: T) {
        this.options.confirmed(item);
        this.hide();
    }

    /** override */
    getFilterKey() {
        return this.options.filterKey;
    }

    panel: AtomCore.Panel = null;
    show() {
        this.storeFocusedElement();
        if (!this.panel) this.panel = atom.workspace.addModalPanel({ item: this });
        this.panel.show()

        this.focusFilterEditor();        
        // debugger; // DEBUG: the UI in the inspector so that it doesn't change on you
    }
    hide() {
        this.panel.hide();
        this.restoreFocus();
    }

    cancelled() {
        this.hide();
    }
}

