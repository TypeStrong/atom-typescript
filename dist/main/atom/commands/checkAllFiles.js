"use strict";
const tslib_1 = require("tslib");
const registry_1 = require("./registry");
const atomUtils_1 = require("../atomUtils");
registry_1.commands.set("typescript:check-all-files", deps => {
    return (e) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!atomUtils_1.commandForTypeScript(e)) {
            return;
        }
        const { file } = atomUtils_1.getFilePathPosition();
        const client = yield deps.getClient(file);
        const projectInfo = yield client.executeProjectInfo({
            file,
            needFileNameList: true
        });
        const files = new Set(projectInfo.body.fileNames);
        const max = files.size;
        // There's no real way to know when all of the errors have been received and not every file from
        // the files set is going to receive a a diagnostic event (typically some d.ts files). To counter
        // that, we cancel the listener and close the progress bar after no diagnostics have been received
        // for some amount of time.
        let cancelTimeout;
        const unregister = client.on("syntaxDiag", evt => {
            clearTimeout(cancelTimeout);
            cancelTimeout = setTimeout(cancel, 500);
            files.delete(evt.file);
            updateStatus();
        });
        deps.statusPanel.setProgress({ max, value: 0 });
        client.executeGetErrForProject({ file, delay: 0 });
        function cancel() {
            files.clear();
            updateStatus();
        }
        function updateStatus() {
            if (files.size === 0) {
                unregister();
                deps.statusPanel.setProgress(null);
            }
            else {
                deps.statusPanel.setProgress({ max, value: max - files.size });
            }
        }
    });
});
