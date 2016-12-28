/**
 * A functional form of the SelectListView
 * Only one of these bad boys is allowed on the screen at one time
 */
"use strict";
var singleton;
function default_1(options, editor) {
    if (!singleton)
        singleton = new SimpleOverlaySelectListView(options, editor);
    else {
        singleton.options = options;
        singleton.editor = editor;
    }
    singleton.setItems();
    singleton.show();
    return singleton;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
/**
 * Various Utility section
 */
const sp = require("atom-space-pen-views");
class SimpleOverlaySelectListView extends sp.SelectListView {
    constructor(options, editor) {
        super();
        this.options = options;
        this.editor = editor;
        this.$.addClass('atomts-overlay');
        this.filterEditorView.model.placeholderText = 'Filter list';
    }
    get $() {
        return this;
    }
    setItems() {
        super.setItems(this.options.items);
    }
    /** override */
    viewForItem(item) {
        return `<li>
            ${this.options.viewForItem(item)}
        </li>`;
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
        this._overlayDecoration = this.editor.decorateMarker(this.editor.getLastCursor().getMarker(), { type: "overlay", position: "tail", item: this });
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
exports.SimpleOverlaySelectListView = SimpleOverlaySelectListView;
