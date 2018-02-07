"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
const utils_1 = require("../utils");
const symbolsViewMain_1 = require("../views/symbols/symbolsViewMain");
registry_1.commands.set("typescript:toggle-project-symbols", () => {
    return async (e) => {
        if (!utils_1.commandForTypeScript(e)) {
            return;
        }
        symbolsViewMain_1.toggleProjectSymbols();
    };
});
//# sourceMappingURL=projectSymbolsView.js.map