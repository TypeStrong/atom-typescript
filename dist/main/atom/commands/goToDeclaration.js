"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const registry_1 = require("./registry");
const utils_1 = require("../utils");
const simpleSelectionView_1 = require("../views/simpleSelectionView");
const prevCursorPositions = [];
function open(item) {
    atom.workspace.open(item.file, {
        initialLine: item.start.line - 1,
        initialColumn: item.start.offset - 1
    });
}
registry_1.commands.set("typescript:go-to-declaration", deps => {
    return (e) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!utils_1.commandForTypeScript(e)) {
            return;
        }
        const location = utils_1.getFilePathPosition();
        const client = yield deps.getClient(location.file);
        const result = yield client.executeDefinition(location);
        if (result.body.length > 1) {
            simpleSelectionView_1.simpleSelectionView({
                items: result.body,
                viewForItem: item => {
                    return `
                <span>${item.file}</span>
                <div class="pull-right">line: ${item.start.line}</div>
            `;
                },
                filterKey: 'filePath',
                confirmed: item => {
                    prevCursorPositions.push(location);
                    open(item);
                }
            });
        }
        else {
            prevCursorPositions.push(location);
            open(result.body[0]);
        }
    });
});
registry_1.commands.set("typescript:return-from-declaration", deps => {
    return (e) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const position = prevCursorPositions.pop();
        if (!position) {
            atom.notifications.addInfo('AtomTS: Previous position not found.');
            return;
        }
        open({
            file: position.file,
            start: { line: position.line, offset: position.offset }
        });
    });
});
//# sourceMappingURL=goToDeclaration.js.map