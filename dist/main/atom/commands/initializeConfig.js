"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const registry_1 = require("./registry");
const clientResolver_1 = require("../../../client/clientResolver");
const child_process_1 = require("child_process");
registry_1.commands.set("typescript:initialize-config", () => {
    return (ev) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const projectDirs = atom.project.getDirectories();
            if (projectDirs.length === 0)
                throw new Error("ENOPROJECT");
            const editor = atom.workspace.getActiveTextEditor();
            if (!editor)
                throw new Error("ENOEDITOR");
            const currentPath = editor.getPath();
            if (!currentPath)
                throw new Error("ENOPATH");
            const pathToTsc = (yield clientResolver_1.resolveBinary(currentPath, "tsc")).pathToBin;
            for (const projectDir of projectDirs) {
                if (projectDir.contains(currentPath)) {
                    yield initConfig(pathToTsc, projectDir.getPath());
                }
            }
        }
        catch (e) {
            switch (e.message) {
                case "ENOPROJECT":
                case "ENOEDITOR":
                    ev.abortKeyBinding();
                    return;
                case "ENOPATH":
                    atom.notifications.addWarning("Current editor has no file path. Can not determine which project to initialize", {
                        dismissable: true,
                    });
                    return;
                default:
                    atom.notifications.addFatalError("Something went wrong, see details below.", {
                        detail: e.message,
                        dismissable: true,
                        stack: e.stack,
                    });
            }
        }
    });
});
function initConfig(tsc, projectRoot) {
    return new Promise((resolve, reject) => {
        try {
            child_process_1.execFile(tsc, ["--init"], { cwd: projectRoot }, err => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        }
        catch (e) {
            reject(e);
        }
    });
}
//# sourceMappingURL=initializeConfig.js.map