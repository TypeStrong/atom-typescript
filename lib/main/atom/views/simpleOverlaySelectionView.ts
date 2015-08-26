/**
 * A functional form of the SelectListView
 * Only one of these bad boys is allowed on the screen at one time
 */

export interface SelectListViewOptions<T> {
    items: T[];
    /** everything except the `li` which is required and we add for you */
    viewForItem: (item: T) => string;

    /** some property on item */
    filterKey: string;
    confirmed: (item: T) => any;
}

var singleton: SimpleOverlaySelectListView<any>;

export default function <T>(options: SelectListViewOptions<T>, editor: AtomCore.IEditor): SimpleOverlaySelectListView<T> {
    if (!singleton) singleton = new SimpleOverlaySelectListView<T>(options, editor);
    else {
        singleton.options = options;
        singleton.editor = editor;
    }

    singleton.setItems();
    singleton.show();
    return singleton;
}

/**
 * Various Utility section
 */

import sp = require('atom-space-pen-views');
import * as atomUtils from "../atomUtils";

export class SimpleOverlaySelectListView<T> extends sp.SelectListView {

    private _overlayDecoration: AtomCore.Decoration;


    constructor(public options: SelectListViewOptions<T>, public editor: AtomCore.IEditor) {
        super();

        this.$.addClass('atomts-overlay');
        (<any>this.filterEditorView).model.placeholderText = 'Filter list';
    }

    get $(): JQuery {
        return <any>this;
    }

    public setItems() {
        super.setItems(this.options.items)
    }

    /** override */
    viewForItem(item: T) {
        return `<li>
            ${this.options.viewForItem(item) }
        </li>`;
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

    show() {
        this.storeFocusedElement();
        this._overlayDecoration = this.editor.decorateMarker(this.editor.getLastCursor().getMarker(),
            { type: "overlay", position: "tail", item: this });

        /** I've need to do this timeout otherwise we don't get focus. I suspect its an artifact of creating an overlay decoration */
        // Comment this out if you want to test styles ;)
        setTimeout(() => this.focusFilterEditor(), 100);
    }

    hide() {
        this.restoreFocus();

        if (this._overlayDecoration)
            this._overlayDecoration.destroy();
    }

    cancelled() {
        this.hide();
    }
}
