"use strict";
const tslib_1 = require("tslib");
const registry_1 = require("./registry");
const atomUtils_1 = require("../atomUtils");
registry_1.commands.set("typescript:check-all-files", deps => {
    return (e) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!atomUtils_1.commandForTypeScript(e)) {
            return;
        }
        const location = atomUtils_1.getFilePathPosition();
        const client = yield deps.getClient(location.file);
        client.executeGetErrForProject({ file: location.file, delay: 0 });
    });
});
