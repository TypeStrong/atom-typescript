"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
const tooltipManager_1 = require("../tooltipManager");
registry_1.commands.set("typescript:show-tooltip", _deps => {
    return async () => {
        const ed = atom.workspace.getActiveTextEditor();
        if (!ed)
            return;
        return tooltipManager_1.showExpressionAt(ed, ed.getLastCursor().getBufferPosition());
    };
});
//# sourceMappingURL=showTooltip.js.map