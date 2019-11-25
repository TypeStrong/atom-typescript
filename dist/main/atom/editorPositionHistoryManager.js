"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
const utils_1 = require("./utils");
const highlightComponent_1 = require("./views/highlightComponent");
const simpleSelectionView_1 = require("./views/simpleSelectionView");
class EditorPositionHistoryManager {
    constructor(prevCursorPositions = []) {
        this.prevCursorPositions = prevCursorPositions;
    }
    async goBack() {
        return this.goHistory(1);
    }
    async goHistory(depth) {
        let position;
        while (depth-- > 0)
            position = this.prevCursorPositions.pop();
        if (!position) {
            atom.notifications.addInfo("AtomTS: Previous position not found.");
            return;
        }
        return this.open({
            file: position.file,
            start: { line: position.line, offset: position.offset },
        });
    }
    async goForward(currentEditor, item) {
        const location = utils_1.getFilePathPosition(currentEditor);
        if (location) {
            this.prevCursorPositions.push(location);
            const maxItems = 100;
            if (this.prevCursorPositions.length > maxItems) {
                this.prevCursorPositions.splice(0, this.prevCursorPositions.length - maxItems);
            }
        }
        return this.open(item);
    }
    async showHistory() {
        const res = await simpleSelectionView_1.selectListView({
            items: this.getHistory()
                .slice()
                .reverse()
                .map((item, idx) => (Object.assign(Object.assign({}, item), { idx }))),
            itemTemplate: (item, ctx) => (etch.dom("li", { className: "two-lines" },
                etch.dom("div", { className: "primary-line" },
                    etch.dom(highlightComponent_1.HighlightComponent, { label: item.file, query: ctx.getFilterQuery() })),
                etch.dom("div", { className: "secondary-line" },
                    "Line: ",
                    item.line,
                    ", column: ",
                    item.offset))),
            itemFilterKey: "file",
        });
        if (res)
            await this.goHistory(res.idx + 1);
    }
    getHistory() {
        return this.prevCursorPositions;
    }
    dispose() {
        // NOOP
    }
    serialize() {
        return this.prevCursorPositions;
    }
    async open(item) {
        const editor = await atom.workspace.open(item.file, {
            initialLine: item.start.line - 1,
            initialColumn: item.start.offset - 1,
            searchAllPanes: true,
        });
        if (atom.workspace.isTextEditor(editor)) {
            editor.scrollToCursorPosition({ center: true });
        }
        return editor;
    }
}
exports.EditorPositionHistoryManager = EditorPositionHistoryManager;
//# sourceMappingURL=editorPositionHistoryManager.js.map