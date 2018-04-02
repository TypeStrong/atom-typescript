"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const simpleSelectionView_1 = require("../simpleSelectionView");
const etch = require("etch");
const generator_1 = require("./generator");
const utils = require("./utils");
const highlightComponent_1 = require("../highlightComponent");
async function toggle(editor, deps) {
    const filePath = editor.getPath();
    if (filePath !== undefined) {
        // NOTE uses the "parent" package's setting (i.e. from symbols-view):
        let initialState;
        if (atom.config.get("symbols-view.quickJumpToFileSymbol")) {
            initialState = utils.serializeEditorState(editor);
        }
        const tag = await simpleSelectionView_1.selectListView({
            items: generator_1.generateFile(filePath, deps),
            itemTemplate: ({ name, position }, ctx) => (etch.dom("li", { class: "two-lines" },
                etch.dom("div", { class: "primary-line" },
                    etch.dom(highlightComponent_1.HighlightComponent, { label: name, query: ctx.getFilterQuery() })),
                etch.dom("div", { class: "secondary-line" }, `Line ${position.row + 1}`))),
            didChangeSelection(item) {
                // NOTE uses the "parent" package's setting (i.e. from symbols-view):
                if (atom.config.get("symbols-view.quickJumpToFileSymbol") && item) {
                    editor.setCursorBufferPosition(item.position);
                }
            },
            itemFilterKey: "name",
        });
        if (tag)
            utils.openTag(tag, editor, deps.getEditorPositionHistoryManager());
        else if (initialState)
            utils.deserializeEditorState(editor, initialState);
    }
}
exports.toggle = toggle;
//# sourceMappingURL=fileSymbolsView.js.map