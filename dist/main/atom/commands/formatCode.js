"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
const utils_1 = require("../utils");
registry_1.commands.set("typescript:format-code", deps => {
    return async (e) => {
        if (!utils_1.commandForTypeScript(e)) {
            return;
        }
        const editor = atom.workspace.getActiveTextEditor();
        if (!editor) {
            e.abortKeyBinding();
            return;
        }
        const filePath = editor.getPath();
        if (!filePath) {
            e.abortKeyBinding();
            return;
        }
        const ranges = [];
        for (const selection of editor.getSelectedBufferRanges()) {
            if (!selection.isEmpty()) {
                ranges.push(utils_1.rangeToLocationRange(selection));
            }
        }
        // Format the whole document if there are no ranges added
        if (ranges.length === 0) {
            const end = editor.buffer.getEndPosition();
            ranges.push({
                line: 1,
                offset: 1,
                endLine: end.row + 1,
                endOffset: end.column + 1,
            });
        }
        const client = await deps.getClient(filePath);
        const edits = [];
        // Collect all edits together so we can update everything in a single transaction
        for (const range of ranges) {
            const result = await client.executeFormat(Object.assign({}, range, { file: filePath }));
            if (result.body) {
                edits.push(...result.body);
            }
        }
        if (edits.length > 0) {
            editor.transact(() => {
                utils_1.formatCode(editor, edits);
            });
        }
    };
});
//# sourceMappingURL=formatCode.js.map