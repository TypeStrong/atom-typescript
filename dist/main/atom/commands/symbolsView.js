"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
registry_1.addCommand("atom-text-editor", "typescript:toggle-file-symbols", deps => ({
    description: "Toggle view for finding file symbols",
    async didDispatch(editor) {
        deps.getSymbolsViewController().toggleFileView(editor);
    },
}));
registry_1.addCommand("atom-text-editor", "typescript:toggle-project-symbols", deps => ({
    description: "Toggle view for finding file symbols",
    async didDispatch(editor) {
        deps.getSymbolsViewController().toggleProjectView(editor);
    },
}));
//# sourceMappingURL=symbolsView.js.map