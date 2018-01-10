"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const registry_1 = require("./registry");
const utils_1 = require("../utils");
const simpleSelectionView_1 = require("../views/simpleSelectionView");
const etch = require("etch");
const tsView_1 = require("../components/tsView");
registry_1.commands.set("typescript:find-references", deps => {
    return (e) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!utils_1.commandForTypeScript(e)) {
            return;
        }
        const location = utils_1.getFilePathPosition();
        if (!location) {
            e.abortKeyBinding();
            return;
        }
        const client = yield deps.getClient(location.file);
        const result = yield client.executeReferences(location);
        const res = yield simpleSelectionView_1.selectListView({
            items: result.body.refs,
            itemTemplate: item => {
                return (etch.dom("div", null,
                    etch.dom("span", null, atom.project.relativize(item.file)),
                    etch.dom("div", { class: "pull-right" },
                        "line: $",
                        item.start.line),
                    etch.dom(tsView_1.TsView, { text: item.lineText.trim() })));
            },
            itemFilterKey: "file",
        });
        if (res) {
            atom.workspace.open(res.file, {
                initialLine: res.start.line - 1,
                initialColumn: res.start.offset - 1,
            });
        }
    });
});
//# sourceMappingURL=findReferences.js.map