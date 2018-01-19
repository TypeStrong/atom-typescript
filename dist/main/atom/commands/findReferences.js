"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
const utils_1 = require("../utils");
const simpleSelectionView_1 = require("../views/simpleSelectionView");
const etch = require("etch");
const tsView_1 = require("../components/tsView");
registry_1.commands.set("typescript:find-references", deps => {
    return async (e) => {
        if (!utils_1.commandForTypeScript(e)) {
            return;
        }
        const location = utils_1.getFilePathPosition();
        if (!location) {
            e.abortKeyBinding();
            return;
        }
        const client = await deps.getClient(location.file);
        const result = await client.executeReferences(location);
        const res = await simpleSelectionView_1.selectListView({
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
    };
});
//# sourceMappingURL=findReferences.js.map