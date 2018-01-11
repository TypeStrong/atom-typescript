"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
const utils_1 = require("../utils");
registry_1.commands.set("typescript:build", deps => {
    return async (e) => {
        if (!utils_1.commandForTypeScript(e)) {
            return;
        }
        const fpp = utils_1.getFilePathPosition();
        if (!fpp) {
            e.abortKeyBinding();
            return;
        }
        const { file } = fpp;
        const client = await deps.getClient(file);
        const projectInfo = await client.executeProjectInfo({
            file,
            needFileNameList: true,
        });
        const files = new Set(projectInfo.body.fileNames);
        files.delete(projectInfo.body.configFileName);
        const promises = [...files.values()].map(f => _finally(client.executeCompileOnSaveEmitFile({ file: f, forced: true }), () => {
            files.delete(file);
        }));
        Promise.all(promises)
            .then(results => {
            if (results.some(result => result.body === false)) {
                throw new Error("Emit failed");
            }
            deps.statusPanel.update({ buildStatus: { success: true } });
        })
            .catch(err => {
            console.error(err);
            deps.statusPanel.update({ buildStatus: { success: false } });
        });
        deps.statusPanel.update({ buildStatus: undefined });
    };
});
function _finally(promise, callback) {
    promise.then(callback, callback);
    return promise;
}
//# sourceMappingURL=build.js.map