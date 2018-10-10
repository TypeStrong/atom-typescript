"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
const utils_1 = require("../../../utils");
registry_1.addCommand("atom-text-editor", "typescript:toggle-semantic-view", deps => ({
    description: "Toggle semantic view outline",
    didDispatch() {
        utils_1.handlePromise(deps.getSemanticViewController().toggle());
    },
}));
//# sourceMappingURL=semanticView.js.map