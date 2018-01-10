"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const registry_1 = require("./registry");
const tooltipManager_1 = require("../tooltipManager");
registry_1.commands.set("typescript:show-tooltip", _deps => {
    return () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const ed = atom.workspace.getActiveTextEditor();
        if (!ed)
            return;
        return tooltipManager_1.showExpressionAt(ed, ed.getLastCursor().getBufferPosition());
    });
});
//# sourceMappingURL=showTooltip.js.map