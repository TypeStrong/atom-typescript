"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
const highlightComponent_1 = require("../highlightComponent");
const simpleSelectionView_1 = require("../simpleSelectionView");
const generator_1 = require("./generator");
const utils = require("./utils");
async function toggle(editor, deps) {
    const filePath = editor.getPath();
    if (filePath !== undefined) {
        const tag = await simpleSelectionView_1.selectListView({
            items: (search) => generator_1.generateProject(filePath, search, deps),
            itemTemplate({ name, position, file }, ctx) {
                const relfile = atom.project.relativize(file);
                return (etch.dom("li", { className: "two-lines" },
                    etch.dom("div", { className: "primary-line" },
                        etch.dom(highlightComponent_1.HighlightComponent, { label: name, query: ctx.getFilterQuery() })),
                    etch.dom("div", { className: "secondary-line" }, `File ${relfile} line ${position.row + 1}`)));
            },
            itemFilterKey: "name",
        });
        if (tag)
            await utils.openTag(tag, editor, deps.histGoForward);
    }
}
exports.toggle = toggle;
//# sourceMappingURL=projectSymbolsView.js.map