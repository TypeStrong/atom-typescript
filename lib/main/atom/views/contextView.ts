import sp = require('atom-space-pen-views');
import mainPanelView = require('./mainPanelView');
import * as semanticView from "./semanticView";

interface ContextViewItem {
    title: string;
}

var titles = {
    togglePanel: 'Toggle TypeScript Panel',
    tabErrors: 'Tab: Errors in Open Files',
    tabLastBuild: 'Tab: Last Build Output',
    tabReferences: 'Tab: Find References',
    fileSemantics: 'Toggle: File Semantics',
}

var items = Object.keys(titles).map(item=> { return { title: titles[item] } });

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
        if (item.title == titles.tabReferences) {
            mainPanelView.panelView.referencesPanelSelected();
        }
        if (item.title == titles.fileSemantics){
            semanticView.toggle();
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
