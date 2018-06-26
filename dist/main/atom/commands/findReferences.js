"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
const utils_1 = require("../utils");
const simpleSelectionView_1 = require("../views/simpleSelectionView");
const etch = require("etch");
const tsView_1 = require("../components/tsView");
const highlightComponent_1 = require("../views/highlightComponent");
registry_1.addCommand("atom-text-editor", "typescript:find-references", deps => ({
    description: "Find where symbol under text cursor is referenced",
    async didDispatch(editor) {
        const location = utils_1.getFilePathPosition(editor);
        if (!location)
            return;
        const client = await deps.getClient(location.file);
        const result = await client.execute("references", location);
        const res = await simpleSelectionView_1.selectListView({
            items: result.body.refs,
            itemTemplate: (item, ctx) => {
                return (etch.dom("li", null,
                    etch.dom(highlightComponent_1.HighlightComponent, { label: atom.project.relativize(item.file), query: ctx.getFilterQuery() }),
                    etch.dom("div", { class: "pull-right" },
                        "line: ",
                        item.start.line),
                    etch.dom(tsView_1.TsView, { text: item.lineText.trim() })));
            },
            itemFilterKey: "file",
        });
        if (res)
            deps.getEditorPositionHistoryManager().goForward(editor, res);
    },
}));
//# sourceMappingURL=findReferences.js.map