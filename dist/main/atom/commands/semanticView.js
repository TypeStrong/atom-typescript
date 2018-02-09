"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
const utils_1 = require("../utils");
const semanticViewController_1 = require("../views/outline/semanticViewController");
registry_1.commands.set("typescript:toggle-semantic-view", () => {
    return e => {
        if (!utils_1.commandForTypeScript(e)) {
            return;
        }
        semanticViewController_1.SemanticViewController.toggle();
    };
});
//# sourceMappingURL=semanticView.js.map