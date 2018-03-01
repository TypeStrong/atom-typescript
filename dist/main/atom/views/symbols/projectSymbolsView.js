"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const simpleSelectionView_1 = require("../simpleSelectionView");
const etch = require("etch");
const utils = require("./utils");
const generator_1 = require("./generator");
async function toggle(editor, deps) {
    const filePath = editor.getPath();
    if (filePath) {
        const tag = await simpleSelectionView_1.selectListView({
            items: (search) => generator_1.generateProject(filePath, search, deps),
            itemTemplate({ name, position, file }) {
                const relfile = atom.project.relativize(file);
                return (etch.dom("li", { class: "two-lines" },
                    etch.dom("div", { class: "primary-line" }, name),
                    etch.dom("div", { class: "secondary-line" }, `File ${relfile} line ${position.row + 1}`)));
            },
            itemFilterKey: "name",
        });
        if (tag)
            utils.openTag(tag);
    }
}
exports.toggle = toggle;
//# sourceMappingURL=projectSymbolsView.js.map