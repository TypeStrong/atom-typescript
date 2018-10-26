"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
registry_1.addCommand("atom-workspace", "typescript:clear-errors", deps => ({
    description: "Clear error messages",
    didDispatch() {
        deps.clearErrors();
    },
}));
//# sourceMappingURL=clearErrors.js.map