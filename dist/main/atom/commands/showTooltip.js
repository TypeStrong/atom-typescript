"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
const tooltipManager_1 = require("../tooltipManager");
registry_1.addCommand("atom-text-editor", "typescript:show-tooltip", () => ({
    description: "Show type tooltip at current text cursor position",
    async didDispatch(e) {
        const ed = e.currentTarget.getModel();
        return tooltipManager_1.showExpressionAt(ed, ed.getLastCursor().getBufferPosition());
    },
}));
//# sourceMappingURL=showTooltip.js.map