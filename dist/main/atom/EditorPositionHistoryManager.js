"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
class EditorPositionHistoryManager {
    constructor(prevCursorPositions = []) {
        this.prevCursorPositions = prevCursorPositions;
    }
    goBack() {
        const position = this.prevCursorPositions.pop();
        if (!position) {
            atom.notifications.addInfo("AtomTS: Previous position not found.");
            return;
        }
        this.open({
            file: position.file,
            start: { line: position.line, offset: position.offset },
        });
    }
    goForward(currentEditor, item) {
        const location = utils_1.getFilePathPosition(currentEditor);
        if (location)
            this.prevCursorPositions.push(location);
        this.open(item);
    }
    dispose() {
        // NOOP
    }
    async open(item) {
        const editor = await atom.workspace.open(item.file, {
            initialLine: item.start.line - 1,
            initialColumn: item.start.offset - 1,
        });
        if (atom.workspace.isTextEditor(editor)) {
            editor.scrollToCursorPosition({ center: true });
        }
    }
}
exports.EditorPositionHistoryManager = EditorPositionHistoryManager;
//# sourceMappingURL=EditorPositionHistoryManager.js.map