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
    viewForItem(item) {
        return `<li>
            ${this.options.viewForItem(item)}
        </li>`;
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
        this._overlayDecoration = this.editor.decorateMarker(this.editor.getLastCursor().getMarker(), { type: "overlay", position: "tail", item: this });
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
