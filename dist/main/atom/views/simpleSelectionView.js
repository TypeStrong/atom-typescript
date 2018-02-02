"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SelectListView = require("atom-select-list");
const etch = require("etch");
async function selectListView({ items, itemTemplate, itemFilterKey, }) {
    let panel;
    const currentFocus = document.activeElement;
    try {
        return await new Promise(resolve => {
            const select = new SelectListView({
                items,
                elementForItem: (item) => etch.render(etch.dom("li", null, itemTemplate(item))),
                filterKeyForItem: (item) => `${item[itemFilterKey]}`,
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
}
exports.selectListView = selectListView;
//# sourceMappingURL=simpleSelectionView.js.map