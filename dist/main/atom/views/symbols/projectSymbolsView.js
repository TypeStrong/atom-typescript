"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const simpleSelectionView_1 = require("../simpleSelectionView");
const etch = require("etch");
const utils = require("./utils");
const generator_1 = require("./generator");
const highlightComponent_1 = require("../highlightComponent");
async function toggle(editor, deps) {
    const filePath = editor.getPath();
    if (filePath !== undefined) {
        const tag = await simpleSelectionView_1.selectListView({
            items: (search) => generator_1.generateProject(filePath, search, deps),
            itemTemplate({ name, position, file }, ctx) {
                const relfile = atom.project.relativize(file);
                return (etch.dom("li", { class: "two-lines" },
                    etch.dom("div", { class: "primary-line" },
                        etch.dom(highlightComponent_1.HighlightComponent, { label: name, query: ctx.getFilterQuery() })),
                    etch.dom("div", { class: "secondary-line" }, `File ${relfile} line ${position.row + 1}`)));
            },
            itemFilterKey: "name",
        });
        if (tag)
            utils.openTag(tag, editor, deps.getEditorPositionHistoryManager());
    }
}
exports.toggle = toggle;
//# sourceMappingURL=projectSymbolsView.js.map