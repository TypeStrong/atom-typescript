"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
registry_1.addCommand("atom-workspace", "typescript:clear-errors", deps => ({
    description: "Clear error messages",
    didDispatch() {
        deps.clearErrors();
    },
}));
registry_1.addCommand("atom-text-editor", "typescript:reload-projects", deps => ({
    description: "Reload projects",
    async didDispatch(editor) {
        const path = editor.getPath();
        if (path === undefined)
            return;
        const client = await deps.getClient(path);
        client.execute("reloadProjects", undefined);
    },
}));
//# sourceMappingURL=clearErrors.js.map