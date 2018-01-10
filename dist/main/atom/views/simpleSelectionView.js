"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const SelectListView = require("atom-select-list");
const etch = require("etch");
function selectListView({ items, itemTemplate, itemFilterKey, }) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
        const myitems = yield Promise.resolve(items);
        let panel;
        let res;
        const currentFocus = document.activeElement;
        try {
            res = yield new Promise(resolve => {
                const select = new SelectListView({
                    items: myitems,
                    // infoMessage: heading,
                    itemsClassList: ["atom-typescript"],
                    elementForItem,
                    filterKeyForItem,
                    didCancelSelection: () => {
                        resolve();
                    },
                    didConfirmSelection: (item) => {
                        resolve(item);
                    },
                });
                select.element.classList.add("ide-haskell");
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
    });
}
exports.selectListView = selectListView;
//# sourceMappingURL=simpleSelectionView.js.map