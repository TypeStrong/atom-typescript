"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
registry_1.addCommand("atom-workspace", "typescript:restart-all-servers", deps => ({
    description: "Kill all tsserver instances. They will be auto-restarted",
    async didDispatch() {
        deps.killAllServers();
    },
}));
//# sourceMappingURL=restartAllServers.js.map