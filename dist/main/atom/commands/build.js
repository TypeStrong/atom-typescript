"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
registry_1.addCommand("atom-text-editor", "typescript:build", deps => ({
    description: "Compile all files in project related to current active text editor",
    async didDispatch(editor) {
        const file = editor.getPath();
        if (file === undefined)
            return;
        const client = await deps.getClient(file);
        deps.reportBuildStatus(undefined);
        const projectInfo = await client.execute("projectInfo", {
            file,
            needFileNameList: true,
        });
        const files = new Set(projectInfo.body.fileNames);
        files.delete(projectInfo.body.configFileName);
        let filesSoFar = 0;
        const promises = [...files.values()].map(f => _finally(client.execute("compileOnSaveEmitFile", { file: f, forced: true }), () => {
            filesSoFar += 1;
            deps.reportProgress({ max: files.size, value: filesSoFar });
        }));
        try {
            const results = await Promise.all(promises);
            if (results.some(result => result.body === false)) {
                throw new Error("Emit failed");
            }
            deps.reportBuildStatus({ success: true });
        }
        catch (error) {
            const err = error;
            console.error(err);
            deps.reportBuildStatus({ success: false, message: err.message });
        }
    },
}));
function _finally(promise, callback) {
    promise.then(callback, callback);
    return promise;
}
//# sourceMappingURL=build.js.map