"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
registry_1.addCommand("atom-text-editor", "typescript:toggle-semantic-view", deps => ({
    description: "Toggle semantic view outline",
    didDispatch() {
        deps.getSemanticViewController().toggle();
    },
}));
//# sourceMappingURL=semanticView.js.map