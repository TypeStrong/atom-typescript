"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
const utils_1 = require("../utils");
registry_1.addCommand("atom-text-editor", "typescript:toggle-file-symbols", deps => ({
    description: "Toggle view for finding file symbols",
    async didDispatch(e) {
        if (!utils_1.commandForTypeScript(e)) {
            return;
        }
        deps.getSymbolsViewController().toggleFileView(e.currentTarget.getModel());
    },
}));
registry_1.addCommand("atom-text-editor", "typescript:toggle-project-symbols", deps => ({
    description: "Toggle view for finding file symbols",
    async didDispatch(e) {
        if (!utils_1.commandForTypeScript(e)) {
            return;
        }
        deps.getSymbolsViewController().toggleProjectView(e.currentTarget.getModel());
    },
}));
//# sourceMappingURL=symbolsView.js.map