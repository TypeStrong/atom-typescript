"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
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