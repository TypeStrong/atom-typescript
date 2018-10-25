"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
registry_1.addCommand("atom-text-editor", "typescript:hide-signature-help", deps => ({
    description: "Hide the currently visible signature help",
    async didDispatch(ed, ignore) {
        if (!deps.hideSigHelpAt(ed))
            ignore();
    },
}));
//# sourceMappingURL=hideSigHelp.js.map