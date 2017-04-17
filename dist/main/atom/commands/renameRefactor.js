"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const registry_1 = require("./registry");
const utils_1 = require("../utils");
const utils_2 = require("../utils");
registry_1.commands.set("typescript:rename-refactor", deps => {
    return (e) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!utils_1.commandForTypeScript(e)) {
            return;
        }
        const location = utils_1.getFilePathPosition();
        const client = yield deps.getClient(location.file);
        const response = yield client.executeRename(location);
        const { info, locs } = response.body;
        if (!info.canRename) {
            return atom.notifications.addInfo("AtomTS: Rename not available at cursor location");
        }
        const newName = yield deps.renameView.showRenameDialog({
            autoSelect: true,
            title: "Rename Variable",
            text: info.displayName,
            onValidate: (newText) => {
                if (newText.replace(/\s/g, "") !== newText.trim()) {
                    return "The new variable must not contain a space";
                }
                if (!newText.trim()) {
                    return "If you want to abort : Press esc to exit";
                }
                return "";
            }
        });
        locs.map((loc) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { buffer, isOpen } = yield deps.getTypescriptBuffer(loc.file);
            buffer.buffer.transact(() => {
                for (const span of loc.locs) {
                    buffer.buffer.setTextInRange(utils_2.spanToRange(span), newName);
                }
            });
            if (!isOpen) {
                buffer.buffer.save();
                buffer.on("saved", () => {
                    buffer.buffer.destroy();
                });
            }
        }));
    });
});
//# sourceMappingURL=renameRefactor.js.map