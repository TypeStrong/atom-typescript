"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const registry_1 = require("./registry");
const utils_1 = require("../utils");
const atomts_1 = require("../../atomts");
registry_1.commands.set("typescript:format-code", deps => {
    return (e) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!utils_1.commandForTypeScript(e)) {
            return;
        }
        const editor = atom.workspace.getActiveTextEditor();
        const filePath = editor.getPath();
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
                endOffset: end.column + 1
            });
        }
        const client = yield deps.getClient(filePath);
        const options = yield getProjectCodeSettings(filePath);
        // Newer versions of tsserver ignore the options argument so we need to call
        // configure with the format code options to make the format command do anything.
        client.executeConfigure({
            formatOptions: options
        });
        const edits = [];
        // Collect all edits together so we can update everything in a single transaction
        for (const range of ranges) {
            const result = yield client.executeFormat(Object.assign({}, range, { options, file: filePath }));
            if (result.body) {
                edits.push(...result.body);
            }
        }
        if (edits.length > 0) {
            editor.transact(() => {
                utils_1.formatCode(editor, edits);
            });
        }
    });
});
function getProjectCodeSettings(filePath) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const config = yield atomts_1.loadProjectConfig(filePath);
        const options = config.formatCodeOptions;
        return Object.assign({ indentSize: atom.config.get("editor.tabLength"), tabSize: atom.config.get("editor.tabLength") }, options);
    });
}
//# sourceMappingURL=formatCode.js.map