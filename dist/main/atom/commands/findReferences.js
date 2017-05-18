"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const registry_1 = require("./registry");
const utils_1 = require("../utils");
const simpleSelectionView_1 = require("../views/simpleSelectionView");
const escapeHtml = require("escape-html");
registry_1.commands.set("typescript:find-references", deps => {
    return (e) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!utils_1.commandForTypeScript(e)) {
            return;
        }
        const location = utils_1.getFilePathPosition();
        const client = yield deps.getClient(location.file);
        const result = yield client.executeReferences(location);
        simpleSelectionView_1.simpleSelectionView({
            items: result.body.refs,
            viewForItem: item => {
                return `<div>
          <span>${atom.project.relativize(item.file)}</span>
          <div class="pull-right">line: ${item.start.line}</div>
          <ts-view>${escapeHtml(item.lineText.trim())}</ts-view>
        </div>`;
            },
            filterKey: 'filePath',
            confirmed: item => open(item)
        });
        function open(item) {
            atom.workspace.open(item.file, {
                initialLine: item.start.line - 1,
                initialColumn: item.start.offset - 1
            });
        }
    });
});
//# sourceMappingURL=findReferences.js.map