"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const client_1 = require("../../../client");
const registry_1 = require("./registry");
registry_1.addCommand("atom-text-editor", "typescript:initialize-config", () => ({
    description: "Create tsconfig.json in the project related to currently-active text edtior",
    async didDispatch(editor, abort) {
        const projectDirs = atom.project.getDirectories();
        if (projectDirs.length === 0)
            return abort();
        const currentPath = editor.getPath();
        if (currentPath === undefined)
            return;
        const pathToTsc = (await client_1.resolveBinary(currentPath, "tsc")).pathToBin;
        for (const projectDir of projectDirs) {
            if (projectDir.contains(currentPath)) {
                await initConfig(pathToTsc, projectDir.getPath());
                atom.notifications.addSuccess(`Successfully created tsconfig.json in ${projectDir.getPath()}`);
            }
        }
    },
}));
async function initConfig(tsc, projectRoot) {
    let disp;
    try {
        return await new Promise((resolve, reject) => {
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
                disp = bnp.onWillThrowError(reject);
            }
            catch (e) {
                reject(e);
            }
        });
    }
    finally {
        if (disp)
            disp.dispose();
    }
}
//# sourceMappingURL=initializeConfig.js.map