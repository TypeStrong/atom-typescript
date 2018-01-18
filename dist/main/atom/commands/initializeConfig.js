"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const registry_1 = require("./registry");
const clientResolver_1 = require("../../../client/clientResolver");
const child_process_1 = require("child_process");
registry_1.commands.set("typescript:initialize-config", () => {
    return (e) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const projectDirs = atom.project.getDirectories();
        if (projectDirs.length === 0) {
            e.abortKeyBinding();
            return;
        }
        let editor;
        let currentPath;
        try {
            editor = atom.workspace.getActiveTextEditor();
            if (!editor) {
                throw new Error("There is no active text editor available.");
            }
            currentPath = editor.getPath();
            if (!currentPath) {
                throw new Error("There is no active filepath available.");
            }
        }
        catch (e) {
            console.error(e.message);
        }
        const pathToTsc = yield clientResolver_1.resolveModule("typescript/bin/tsc").catch(() => require.resolve("typescript/bin/tsc"));
        for (const projectDir of projectDirs) {
            if (currentPath && projectDir.contains(currentPath)) {
                yield initConfig(pathToTsc, projectDir.getPath());
            }
        }
    });
});
const initConfig = (tsc, projectRoot) => {
    return new Promise((resolve, reject) => {
        try {
            child_process_1.execFile(tsc, ["--init"], {
                cwd: projectRoot,
            }, err => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        }
        catch (e) {
            // error handling is done within callback since operation is async
        }
    });
};
//# sourceMappingURL=initializeConfig.js.map