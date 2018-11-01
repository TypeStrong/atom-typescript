"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
registry_1.addCommand("atom-text-editor", "typescript:toggle-file-symbols", deps => ({
    description: "Toggle view for finding file symbols",
    async didDispatch(editor) {
        deps.toggleFileSymbolsView(editor);
    },
}));
registry_1.addCommand("atom-text-editor", "typescript:toggle-project-symbols", deps => ({
    description: "Toggle view for finding file symbols",
    async didDispatch(editor) {
        deps.toggleProjectSymbolsView(editor);
    },
}));
//# sourceMappingURL=symbolsView.js.map