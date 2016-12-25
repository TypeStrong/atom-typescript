"use strict";
const tslib_1 = require("tslib");
const registry_1 = require("./registry");
const atomUtils_1 = require("../atomUtils");
const tsUtil_1 = require("./../../utils/tsUtil");
registry_1.commands.set("typescript:rename-refactor", deps => {
    return (e) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!atomUtils_1.commandForTypeScript(e)) {
            return;
        }
        const location = atomUtils_1.getFilePathPosition();
        const client = yield deps.getClient(location.file);
        const { body: { info, locs } } = yield client.executeRename(location);
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
            const { buffer, isOpen } = yield deps.getBuffer(loc.file);
            buffer.transact(() => {
                for (const span of loc.locs) {
                    buffer.setTextInRange(tsUtil_1.spanToRange(span), newName);
                }
            });
            if (!isOpen) {
                buffer.save();
                buffer.onDidSave(() => {
                    buffer.destroy();
                });
            }
        }));
    });
});
