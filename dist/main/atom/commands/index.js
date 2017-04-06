"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
// Import all of the command files for their side effects
require("./build");
require("./checkAllFiles");
require("./clearErrors");
require("./formatCode");
require("./findReferences");
require("./goToDeclaration");
require("./renameRefactor");
function registerCommands(deps) {
    for (const [name, command] of registry_1.commands) {
        atom.commands.add("atom-workspace", name, command(deps));
    }
}
exports.registerCommands = registerCommands;
//# sourceMappingURL=index.js.map