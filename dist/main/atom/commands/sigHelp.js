"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
registry_1.addCommand("atom-text-editor", "typescript:show-signature-help", deps => ({
    description: "Show signature help tooltip at current text cursor position",
    async didDispatch(ed) {
        return deps.showSigHelpAt(ed);
    },
}));
registry_1.addCommand("atom-text-editor", "typescript:hide-signature-help", deps => ({
    description: "Hide the currently visible signature help",
    async didDispatch(ed, ignore) {
        if (!deps.hideSigHelpAt(ed))
            ignore();
    },
}));
registry_1.addCommand("atom-text-editor", "typescript:signature-help-next", deps => ({
    description: "Show next signature help if available",
    async didDispatch(ed, ignore) {
        if (!deps.rotateSigHelp(ed, +1))
            ignore();
    },
}));
registry_1.addCommand("atom-text-editor", "typescript:signature-help-prev", deps => ({
    description: "Show previous signature help if available",
    async didDispatch(ed, ignore) {
        if (!deps.rotateSigHelp(ed, -1))
            ignore();
    },
}));
//# sourceMappingURL=sigHelp.js.map