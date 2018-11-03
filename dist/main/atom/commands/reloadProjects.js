"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
registry_1.addCommand("atom-text-editor", "typescript:reload-projects", deps => ({
    description: "Reload projects",
    async didDispatch(editor) {
        const path = editor.getPath();
        if (path === undefined)
            return;
        const client = await deps.getClient(path);
        await client.execute("reloadProjects");
    },
}));
//# sourceMappingURL=reloadProjects.js.map