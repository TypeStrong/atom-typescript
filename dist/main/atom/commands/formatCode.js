"use strict";
const tslib_1 = require("tslib");
const registry_1 = require("./registry");
const atomUtils_1 = require("../atomUtils");
registry_1.commands.set("typescript:format-code", deps => {
    return (e) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!atomUtils_1.commandForTypeScript(e)) {
            return;
        }
        const editor = atom.workspace.getActiveTextEditor();
        const filePath = editor.getPath();
        const ranges = [];
        for (const selection of editor.getSelectedBufferRanges()) {
            if (!selection.isEmpty()) {
                ranges.push(atomUtils_1.rangeToLocationRange(selection));
            }
        }
        // Format the whole document if there are no ranges added
        if (ranges.length === 0) {
            const end = editor.buffer.getEndPosition();
            ranges.push({
                line: 1,
                offset: 1,
                endLine: end.row + 1,
                endOffset: end.column + 1
            });
        }
        const client = yield deps.getClient(filePath);
        const edits = [];
        // Collect all edits together so we can update in a single transaction
        for (const range of ranges) {
            const result = yield client.executeFormat(tslib_1.__assign({}, range, { file: filePath }));
            if (result.body) {
                edits.push(...result.body);
            }
        }
        if (edits.length > 0) {
            editor.transact(() => {
                atomUtils_1.formatCode(editor, edits);
            });
        }
        // if (selection.isEmpty()) {
        // console.log("no selection, format all")
        // parent.formatDocument({ filePath: filePath }).then((result) => {
        //     if (!result.edits.length) return;
        //     editor.transact(() => {
        //         atomUtils.formatCode(editor, result.edits);
        //     });
        // });
        // } else {
        // console.log("selcetion", selection, filePath)
        //
        // parent.formatDocumentRange({ filePath: filePath, start: { line: selection.start.row, col: selection.start.column }, end: { line: selection.end.row, col: selection.end.column } }).then((result) => {
        //     if (!result.edits.length) return;
        //     editor.transact(() => {
        //         atomUtils.formatCode(editor, result.edits);
        //     });
        // });
        // }
    });
});
