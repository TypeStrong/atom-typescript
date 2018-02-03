"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
const utils_1 = require("../utils");
const semanticViewPane_1 = require("../views/semanticViewPane");
registry_1.commands.set("typescript:toggle-semantic-view", () => {
    return e => {
        if (!utils_1.commandForTypeScript(e)) {
            return;
        }
        semanticViewPane_1.toggle();
    };
});
//# sourceMappingURL=semanticView.js.map