"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SelectListView = require("atom-select-list");
const etch = require("etch");
async function selectListView({ items, itemTemplate, itemFilterKey, didChangeSelection, }) {
    let panel;
    const currentFocus = document.activeElement;
    try {
        return await new Promise(resolve => {
            let didChangeQuery;
            let loadingMessage = "Loading...";
            let emptyMessage;
            let resolved = false;
            const update = (props) => {
                if (resolved)
                    return;
                select.update(props);
            };
            if (typeof items === "function") {
                didChangeQuery = async (query) => {
                    const timeout = setTimeout(() => update({ loadingMessage: "Loading..." }), 300);
                    const is = await items(query);
                    clearTimeout(timeout);
                    update({
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
                elementForItem: (item) => etch.render(itemTemplate(item, select)),
                filterKeyForItem: (item) => `${item[itemFilterKey]}`,
                didChangeSelection,
                didCancelSelection: () => {
                    resolved = true;
                    resolve();
                },
                didConfirmSelection: (item) => {
                    resolved = true;
                    resolve(item);
                },
                loadingMessage,
                didChangeQuery,
                emptyMessage,
                itemsClassList: ["atom-typescript"],
            });
            if (typeof items !== "function") {
                Promise.resolve(items).then(is => {
                    update({ items: is, loadingMessage: undefined });
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