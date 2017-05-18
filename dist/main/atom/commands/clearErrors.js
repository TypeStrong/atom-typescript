"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
registry_1.commands.set("typescript:clear-errors", deps => {
    return e => {
        deps.clearErrors();
    };
});
//# sourceMappingURL=clearErrors.js.map