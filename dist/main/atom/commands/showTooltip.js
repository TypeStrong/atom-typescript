"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
registry_1.addCommand("atom-text-editor", "typescript:show-tooltip", deps => ({
    description: "Show type tooltip at current text cursor position",
    async didDispatch(ed) {
        return deps.showTooltipAt(ed);
    },
}));
//# sourceMappingURL=showTooltip.js.map