"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
const clientResolver_1 = require("../../../client/clientResolver");
const atom_1 = require("atom");
registry_1.addCommand("atom-text-editor", "typescript:initialize-config", () => ({
    description: "Create tsconfig.json in the project related to currently-active text edtior",
    async didDispatch(e) {
        try {
            const editor = e.currentTarget.getModel();
            const projectDirs = atom.project.getDirectories();
            if (projectDirs.length === 0)
                throw new Error("ENOPROJECT");
            const currentPath = editor.getPath();
            if (currentPath === undefined)
                throw new Error("ENOPATH");
            const pathToTsc = (await clientResolver_1.resolveBinary(currentPath, "tsc")).pathToBin;
            for (const projectDir of projectDirs) {
                if (projectDir.contains(currentPath)) {
                    await initConfig(pathToTsc, projectDir.getPath());
                    atom.notifications.addSuccess(`Successfully created tsconfig.json in ${projectDir.getPath()}`);
                }
            }
        }
        catch (error) {
            const err = error;
            switch (err.message) {
                case "ENOPROJECT":
                    e.abortKeyBinding();
                    return;
                case "ENOPATH":
                    atom.notifications.addWarning("Current editor has no file path. Can not determine which project to initialize", {
                        dismissable: true,
                    });
                    return;
                default:
                    atom.notifications.addFatalError("Something went wrong, see details below.", {
                        detail: err.message,
                        dismissable: true,
                        stack: err.stack,
                    });
            }
        }
    },
}));
function initConfig(tsc, projectRoot) {
    return new Promise((resolve, reject) => {
        try {
            const bnp = new atom_1.BufferedNodeProcess({
                command: tsc,
                args: ["--init"],
                options: { cwd: projectRoot },
                exit: code => {
                    if (code === 0)
                        resolve();
                    else
                        reject(new Error(`Tsc ended with nonzero exit code ${code}`));
                },
            });
            bnp.onWillThrowError(reject);
        }
        catch (e) {
            reject(e);
        }
    });
}
//# sourceMappingURL=initializeConfig.js.map