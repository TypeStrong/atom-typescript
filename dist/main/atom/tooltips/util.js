"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// screen position from mouse event -- with <3 from Atom-Haskell
function bufferPositionFromMouseEvent(editor, event) {
    const sp = atom.views
        .getView(editor)
        .getComponent()
        .screenPositionForMouseEvent(event);
    if (isNaN(sp.row) || isNaN(sp.column)) {
        return;
    }
    return editor.bufferPositionForScreenPosition(sp);
}
exports.bufferPositionFromMouseEvent = bufferPositionFromMouseEvent;
//# sourceMappingURL=util.js.map