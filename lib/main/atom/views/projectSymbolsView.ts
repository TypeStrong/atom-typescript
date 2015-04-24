import sp = require('atom-space-pen-views');
import mainPanelView = require('./mainPanelView');
import atomUtils = require("../atomUtils");


/**
 * https://github.com/atom/atom-space-pen-views
 */
export class ProjectSymbolsView extends sp.SelectListView {

    get $(): JQuery {
        return <any>this;
    }

    get filterView(): {
        $: JQuery,
        model: AtomCore.IEditor
    } {
        return {
            $: this.filterEditorView,
            model: (<any>this.filterEditorView).model
        };
    }

    public setNavBarItems(tsItems: NavigateToItem[]) {
        super.setMaxItems(40);

        var items: NavigateToItem[] = tsItems;
        super.setItems(items)
    }

    /** override */
    viewForItem(item: NavigateToItem) {
        return `
            <li>
                <div class="highlight">${item.name}</div>
                <div class="pull-right" style="font-weight: bold; color:${atomUtils.kindToColor(item.kind) }">${item.kind}</div>
                <div class="clear">${item.fileName} : ${item.position.line + 1}</div>
            </li>
        `;
    }

    /** override */
    confirmed(item: NavigateToItem) {
        atom.workspace.open(item.filePath, {
            initialLine: item.position.line,
            initialColumn: item.position.col
        });

        this.hide();
    }

    getFilterKey() { return 'name'; }

    panel: AtomCore.Panel = null;
    show() {
        this.storeFocusedElement();
        if (!this.panel) this.panel = atom.workspace.addModalPanel({ item: this });
        this.panel.show()

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
