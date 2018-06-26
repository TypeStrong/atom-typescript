"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
const utils_1 = require("../utils");
const simpleSelectionView_1 = require("../views/simpleSelectionView");
const etch = require("etch");
const highlightComponent_1 = require("../views/highlightComponent");
registry_1.addCommand("atom-text-editor", "typescript:go-to-declaration", deps => ({
    description: "Go to declaration of symbol under text cursor",
    async didDispatch(editor) {
        const location = utils_1.getFilePathPosition(editor);
        if (!location)
            return;
        const client = await deps.getClient(location.file);
        const result = await client.execute("definition", location);
        handleDefinitionResult(result, editor, deps.getEditorPositionHistoryManager());
    },
}));
async function handleDefinitionResult(result, editor, hist) {
    if (!result.body) {
        return;
    }
    else if (result.body.length > 1) {
        const res = await simpleSelectionView_1.selectListView({
            items: result.body,
            itemTemplate: (item, ctx) => {
                return (etch.dom("li", null,
                    etch.dom(highlightComponent_1.HighlightComponent, { label: item.file, query: ctx.getFilterQuery() }),
                    etch.dom("div", { class: "pull-right" },
                        "line: ",
                        item.start.line)));
            },
            itemFilterKey: "file",
        });
        if (res)
            hist.goForward(editor, res);
    }
    else if (result.body.length > 0) {
        hist.goForward(editor, result.body[0]);
    }
}
exports.handleDefinitionResult = handleDefinitionResult;
//# sourceMappingURL=goToDeclaration.js.map