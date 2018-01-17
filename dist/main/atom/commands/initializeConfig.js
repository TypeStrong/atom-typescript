"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const registry_1 = require("./registry");
const child_process_1 = require("child_process");
const Resolve = require("resolve");
registry_1.commands.set("typescript:initialize-config", () => {
    return (e) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const projectRootPaths = atom.project.getPaths();
        if (!projectRootPaths) {
            e.abortKeyBinding();
            return;
        }
        const editor = atom.workspace.getActiveTextEditor();
        let currentlyActivePath;
        if (editor !== undefined) {
            currentlyActivePath = editor.getPath();
        }
        const pathToTsc = yield resolveModule("typescript/bin/tsc");
        for (const projectRootPath of projectRootPaths) {
            if (currentlyActivePath && currentlyActivePath.includes(projectRootPath)) {
                yield initConfig(pathToTsc, projectRootPath);
            }
        }
    });
});
// Promisify the async resolve function
const resolveModule = (id) => {
    return new Promise((resolve, reject) => Resolve(id, (err, result) => {
        if (err) {
            reject(err);
        }
        else {
            resolve(result);
        }
    }));
};
const initConfig = (tsc, projectRoot) => {
    return new Promise((resolve, reject) => {
        try {
            child_process_1.execFile(tsc, ["--init"], {
                cwd: projectRoot,
            });
            resolve();
        }
        catch (e) {
            reject(e);
        }
    });
};
//# sourceMappingURL=initializeConfig.js.map