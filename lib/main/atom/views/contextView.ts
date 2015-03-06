import sp = require('atom-space-pen-views');

interface ContextViewItem {
    title: string;
}

var items = [{ title: 'Toggle TypeScript Panel' }, { title: 'Tab: Errors in Open Files' }, { title: 'Tab: Last Build Output' }];

/** 
 * https://github.com/atom/atom-space-pen-views
 */
export class ContextView extends sp.SelectListView {

    get $(): JQuery {
        return <any>this;
    }
    
    public setItems(items: ContextViewItem[]) { super.setItems(items) }

    /** override */
    viewForItem(item: ContextViewItem) {
        return `<li>${item.title}</li>`;
    }
    
    /** override */
    confirmed(item: ContextViewItem) {
        console.log(item);
        this.hide();
    }

    getFilterKey() { return 'title'; }

    panel: AtomCore.Panel = null;    
    show() {
        this.storeFocusedElement();
        if (!this.panel) this.panel = atom.workspace.addModalPanel({ item: this });
        this.panel.show()

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
