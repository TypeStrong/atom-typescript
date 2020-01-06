"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
const fs = require("fs");
const tsView_1 = require("../components/tsView");
const utils_1 = require("../utils");
const highlightComponent_1 = require("../views/highlightComponent");
const simpleSelectionView_1 = require("../views/simpleSelectionView");
const registry_1 = require("./registry");
registry_1.addCommand("atom-text-editor", "typescript:find-references", deps => ({
    description: "Find where symbol under text cursor is referenced",
    async didDispatch(editor) {
        const location = utils_1.getFilePathPosition(editor);
        if (!location)
            return;
        const client = await deps.getClient(location.file);
        const result = await client.execute("references", location);
        await handleFindReferencesResult(result, editor, deps.histGoForward);
    },
}));
async function handleFindReferencesResult(result, editor, histGoForward) {
    const refs = Promise.all(result.body.refs.map(async (ref) => {
        var _a;
        const fileContents = (await new Promise((resolve, reject) => fs.readFile(ref.file, (error, data) => {
            if (error)
                reject(error);
            else
                resolve(data.toString("utf-8"));
        }))).split(/\r?\n/g);
        const context = ref.contextStart !== undefined && ref.contextEnd !== undefined
            ? fileContents.slice(ref.contextStart.line - 1, ref.contextEnd.line)
            : fileContents;
        const fileHlText = await utils_1.highlight(context.join("\n"), "source.tsx");
        // tslint:disable-next-line: strict-boolean-expressions
        const lineText = fileHlText[ref.start.line - (((_a = ref.contextStart) === null || _a === void 0 ? void 0 : _a.line) || 1)];
        return Object.assign(Object.assign({}, ref), { hlText: lineText });
    }));
    const res = await simpleSelectionView_1.selectListView({
        items: refs,
        itemTemplate: (item, ctx) => {
            return (etch.dom("li", null,
                etch.dom(highlightComponent_1.HighlightComponent, { label: atom.project.relativize(item.file), query: ctx.getFilterQuery() }),
                etch.dom("div", { className: "pull-right" },
                    "line: ",
                    item.start.line),
                etch.dom(tsView_1.TsView, { highlightedText: item.hlText })));
        },
        itemFilterKey: "file",
    });
    if (res)
        await histGoForward(editor, res);
}
exports.handleFindReferencesResult = handleFindReferencesResult;
//# sourceMappingURL=findReferences.js.map