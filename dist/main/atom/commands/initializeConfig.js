"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const registry_1 = require("./registry");
const clientResolver_1 = require("../../../client/clientResolver");
const child_process_1 = require("child_process");
registry_1.commands.set("typescript:initialize-config", () => {
    return (ev) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        let projectDirs;
        let editor;
        let currentPath;
        let pathToTsc;
        try {
            projectDirs = atom.project.getDirectories();
            if (projectDirs.length === 0) {
                throw new Error("ENOPROJECT");
            }
            editor = atom.workspace.getActiveTextEditor();
            if (!editor) {
                throw new Error("ENOEDITOR");
            }
            currentPath = editor.getPath();
            if (!currentPath) {
                throw new Error("ENOPATH");
            }
        }
        catch (e) {
            switch (e.message) {
                case "ENOPROJECT":
                case "ENOEDITOR":
                    ev.abortKeyBinding();
                    return;
                default:
                    if (e.stack) {
                        atom.notifications.addFatalError("Something went wrong, see details below.", {
                            detail: e.message,
                            dismissable: true,
                            stack: e.stack,
                        });
                    }
                    else {
                        atom.notifications.addError("Unknown error has occured.", {
                            detail: e.message,
                            dismissable: true,
                        });
                    }
            }
        }
        if (currentPath) {
            pathToTsc = (yield clientResolver_1.resolveBinary(currentPath, "tsc")).pathToBin;
        }
        if (projectDirs) {
            for (const projectDir of projectDirs) {
                if (currentPath && projectDir.contains(currentPath) && pathToTsc) {
                    yield initConfig(pathToTsc, projectDir.getPath()).catch(e => {
                        atom.notifications.addFatalError("Something went wrong, see details below.", {
                            detail: e.message,
                            dismissable: true,
                            stack: e.stack,
                        });
                    });
                }
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
            reject(e);
        }
    });
};
//# sourceMappingURL=initializeConfig.js.map