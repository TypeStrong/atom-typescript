import sp = require('atom-space-pen-views');
import mainPanelView = require('./mainPanelView');

interface ContextViewItem {
    title: string;
}

var titles = {
    togglePanel: 'Toggle TypeScript Panel',
    tabErrors: 'Tab: Errors in Open Files',
    tabLastBuild: 'Tab: Last Build Output'
}

var items = [{ title: titles.togglePanel }, { title: titles.tabErrors }, { title: titles.tabLastBuild }];

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
        if (item.title == titles.togglePanel) {
            mainPanelView.panelView.toggle();
        }
        if (item.title == titles.tabErrors) {
            mainPanelView.panelView.errorPanelSelected();
        }
        if (item.title == titles.tabLastBuild) {
            mainPanelView.panelView.buildPanelSelected();
        }
        
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
