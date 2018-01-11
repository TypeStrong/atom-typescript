"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SelectListView = require("atom-select-list");
const etch = require("etch");
async function selectListView({ items, itemTemplate, itemFilterKey, }) {
    const elementForItem = (item) => etch.render(etch.dom("li", null, itemTemplate(item)));
    const filterKeyForItem = (item) => {
        if (typeof itemFilterKey === "function") {
            // @ts-ignore // TODO: Complain to MS
            return itemFilterKey(item);
        }
        else if (itemFilterKey) {
            return `${item[itemFilterKey]}`;
        }
        else {
            return `${item}`;
        }
    };
    const myitems = await Promise.resolve(items);
    let panel;
    let res;
    const currentFocus = document.activeElement;
    try {
        res = await new Promise(resolve => {
            const select = new SelectListView({
                items: myitems,
                elementForItem,
                filterKeyForItem,
                didCancelSelection: () => {
                    resolve();
                },
                didConfirmSelection: (item) => {
                    resolve(item);
                },
            });
            panel = atom.workspace.addModalPanel({
                item: select,
                visible: true,
            });
            select.focus();
        });
    }
    finally {
        if (panel)
            panel.destroy();
        if (currentFocus)
            currentFocus.focus();
    }
    return res;
}
exports.selectListView = selectListView;
//# sourceMappingURL=simpleSelectionView.js.map