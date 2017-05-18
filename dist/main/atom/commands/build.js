"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const registry_1 = require("./registry");
const utils_1 = require("../utils");
registry_1.commands.set("typescript:build", deps => {
    return (e) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!utils_1.commandForTypeScript(e)) {
            return;
        }
        const { file } = utils_1.getFilePathPosition();
        const client = yield deps.getClient(file);
        const projectInfo = yield client.executeProjectInfo({
            file,
            needFileNameList: true
        });
        const files = new Set(projectInfo.body.fileNames);
        const max = files.size;
        const promises = [...files.values()].map(file => _finally(client.executeCompileOnSaveEmitFile({ file, forced: true }), () => {
            files.delete(file);
            updateStatus();
        }));
        Promise.all(promises).then(results => {
            if (results.some(result => result.body === false)) {
                throw new Error("Emit failed");
            }
            deps.statusPanel.setBuildStatus({ success: true });
        }).catch(() => {
            deps.statusPanel.setBuildStatus({ success: false });
        });
        deps.statusPanel.setBuildStatus(undefined);
        deps.statusPanel.setProgress({ max, value: 0 });
        function updateStatus() {
            if (files.size === 0) {
                deps.statusPanel.setProgress(undefined);
            }
            else {
                deps.statusPanel.setProgress({ max, value: max - files.size });
            }
        }
    });
});
function _finally(promise, callback) {
    promise.then(callback, callback);
    return promise;
}
//# sourceMappingURL=build.js.map