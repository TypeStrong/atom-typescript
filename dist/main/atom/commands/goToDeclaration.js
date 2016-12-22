"use strict";
const tslib_1 = require("tslib");
const registry_1 = require("./registry");
const atomUtils_1 = require("../atomUtils");
const simpleSelectionView_1 = require("../views/simpleSelectionView");
registry_1.commands.set("typescript:go-to-declaration", deps => {
    return (e) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!atomUtils_1.commandForTypeScript(e)) {
            return;
        }
        const location = atomUtils_1.getFilePathPosition();
        const client = yield deps.clientResolver.get(location.file);
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
                confirmed: open
            });
        }
        else {
            open(result.body[0]);
        }
        function open(item) {
            atom.workspace.open(item.file, {
                initialLine: item.start.line - 1,
                initialColumn: item.start.offset - 1
            });
        }
    });
});
