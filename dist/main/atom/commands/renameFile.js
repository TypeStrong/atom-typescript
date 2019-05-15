"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-plus");
const renameView_1 = require("../views/renameView");
const registry_1 = require("./registry");
registry_1.addCommand("atom-text-editor", "typescript:rename-file", deps => ({
    description: "Rename current file",
    async didDispatch(editor) {
        const location = editor.getPath();
        // tslint:disable-next-line: strict-boolean-expressions
        if (!location)
            return;
        const newLocation = await renameView_1.showRenameDialog({
            autoSelect: true,
            title: "Rename File",
            text: location,
            onValidate: (newText) => {
                if (!newText.trim()) {
                    return "If you want to abort : Press esc to exit";
                }
                return "";
            },
        });
        // tslint:disable-next-line: strict-boolean-expressions
        if (!newLocation)
            return;
        const client = await deps.getClient(location);
        const response = await client.execute("getEditsForFileRename", {
            oldFilePath: location,
            newFilePath: newLocation,
        });
        await deps.applyEdits(response.body);
        await new Promise((resolve, reject) => {
            fs.move(location, newLocation, (err) => {
                if (err)
                    reject(err);
                else {
                    editor.getBuffer().setPath(newLocation);
                    resolve();
                }
            });
        });
    },
}));
//# sourceMappingURL=renameFile.js.map