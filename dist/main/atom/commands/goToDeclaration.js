"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
const utils_1 = require("../utils");
const highlightComponent_1 = require("../views/highlightComponent");
const simpleSelectionView_1 = require("../views/simpleSelectionView");
const registry_1 = require("./registry");
registry_1.addCommand("atom-text-editor", "typescript:go-to-declaration", deps => ({
    description: "Go to declaration of symbol under text cursor",
    async didDispatch(editor) {
        const location = utils_1.getFilePathPosition(editor);
        if (!location)
            return;
        const client = await deps.getClient(location.file);
        const result = await client.execute("definition", location);
        await handleDefinitionResult(result, editor, deps.histGoForward);
    },
}));
async function handleDefinitionResult(result, editor, histGoForward) {
    if (!result.body) {
        return;
    }
    else if (result.body.length > 1) {
        const res = await simpleSelectionView_1.selectListView({
            items: result.body,
            itemTemplate: (item, ctx) => {
                return (etch.dom("li", null,
                    etch.dom(highlightComponent_1.HighlightComponent, { label: item.file, query: ctx.getFilterQuery() }),
                    etch.dom("div", { className: "pull-right" },
                        "line: ",
                        item.start.line)));
            },
            itemFilterKey: "file",
        });
        if (res)
            await histGoForward(editor, res);
    }
    else if (result.body.length > 0) {
        await histGoForward(editor, result.body[0]);
    }
}
exports.handleDefinitionResult = handleDefinitionResult;
//# sourceMappingURL=goToDeclaration.js.map