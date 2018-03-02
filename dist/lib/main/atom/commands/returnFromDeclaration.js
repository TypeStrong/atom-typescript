"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
const simpleSelectionView_1 = require("../views/simpleSelectionView");
const etch = require("etch");
const highlightComponent_1 = require("../views/highlightComponent");
registry_1.addCommand("atom-workspace", "typescript:return-from-declaration", deps => ({
    description: "If used `go-to-declaration`, return to previous text cursor position",
    async didDispatch() {
        deps.getEditorPositionHistoryManager().goBack();
    },
}));
registry_1.addCommand("atom-workspace", "typescript:show-editor-position-history", deps => ({
    description: "If used `go-to-declaration`, return to previous text cursor position",
    async didDispatch() {
        const ehm = deps.getEditorPositionHistoryManager();
        const res = await simpleSelectionView_1.selectListView({
            items: ehm
                .getHistory()
                .slice()
                .reverse()
                .map((item, idx) => (Object.assign({}, item, { idx }))),
            itemTemplate: (item, ctx) => (etch.dom("li", { class: "two-lines" },
                etch.dom("div", { class: "primary-line" },
                    etch.dom(highlightComponent_1.HighlightComponent, { label: item.file, query: ctx.getFilterQuery() })),
                etch.dom("div", { class: "secondary-line" },
                    "Line: ",
                    item.line,
                    ", column: ",
                    item.offset))),
            itemFilterKey: "file",
        });
        if (res)
            ehm.goHistory(res.idx + 1);
    },
}));
//# sourceMappingURL=returnFromDeclaration.js.map