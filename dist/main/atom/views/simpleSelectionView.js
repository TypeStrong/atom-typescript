"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SelectListView = require("atom-select-list");
const etch = require("etch");
async function selectListView({ items, itemTemplate, itemFilterKey, didChangeSelection, itemsClassList, }) {
    let panel;
    const currentFocus = document.activeElement;
    try {
        return await new Promise(resolve => {
            let didChangeQuery;
            let loadingMessage = "Loading...";
            let emptyMessage;
            if (typeof items === "function") {
                didChangeQuery = async (query) => {
                    const timeout = setTimeout(() => select.update({ loadingMessage: "Loading..." }), 300);
                    const is = await items(query);
                    clearTimeout(timeout);
                    select.update({
                        items: is,
                        emptyMessage: "Nothing matches the search value",
                        loadingMessage: undefined,
                    });
                };
                loadingMessage = undefined;
                emptyMessage = "Please enter a search value";
            }
            const select = new SelectListView({
                items: [],
                elementForItem: (item) => etch.render(etch.dom("li", null, itemTemplate(item, select))),
                filterKeyForItem: (item) => `${item[itemFilterKey]}`,
                didChangeSelection,
                didCancelSelection: () => {
                    resolve();
                },
                didConfirmSelection: (item) => {
                    resolve(item);
                },
                loadingMessage,
                didChangeQuery,
                emptyMessage,
                itemsClassList,
            });
            if (typeof items !== "function") {
                Promise.resolve(items).then(is => {
                    select.update({ items: is, loadingMessage: undefined });
                });
            }
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