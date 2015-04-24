import sp = require('atom-space-pen-views');
import mainPanelView = require('./mainPanelView');
import atomUtils = require("../atomUtils");


/** 
 * https://github.com/atom/atom-space-pen-views
 */
export class FileSymbolsView extends sp.SelectListView {

    get $(): JQuery {
        return <any>this;
    }

    public filePath: string;
    public setNavBarItems(tsItems: NavigationBarItem[], filePath) {

        var items: NavigationBarItem[] = tsItems;

        this.filePath = filePath;

        super.setItems(items)
    }

    /** override */
    viewForItem(item: NavigationBarItem) {
        return `
            <li>
                <div class="highlight">${ Array(item.indent * 2).join('&nbsp;') + (item.indent ? "\u221F " : '') + item.text}</div>
                <div class="pull-right" style="font-weight: bold; color:${atomUtils.kindToColor(item.kind) }">${item.kind}</div>
                <div class="clear"> line: ${item.position.line + 1}</div>
            </li>
        `;
    }
    
    /** override */
    confirmed(item: NavigationBarItem) {
        atom.workspace.open(this.filePath, {
            initialLine: item.position.line,
            initialColumn: item.position.col
        });

        this.hide();
    }

    getFilterKey() { return 'text'; }

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
