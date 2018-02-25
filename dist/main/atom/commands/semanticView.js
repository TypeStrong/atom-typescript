"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
const utils_1 = require("../utils");
const semanticViewController_1 = require("../views/outline/semanticViewController");
registry_1.addCommand("atom-text-editor", "typescript:toggle-semantic-view", () => ({
    description: "Toggle semantic view outline",
    async didDispatch(e) {
        if (!utils_1.commandForTypeScript(e)) {
            return;
        }
        semanticViewController_1.SemanticViewController.toggle();
    },
}));
//# sourceMappingURL=semanticView.js.map