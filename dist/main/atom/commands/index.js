"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
const atom_1 = require("atom");
// Import all of the command files for their side effects
require("./build");
require("./checkAllFiles");
require("./clearErrors");
require("./formatCode");
require("./findReferences");
require("./goToDeclaration");
require("./returnFromDeclaration");
require("./renameRefactor");
require("./showTooltip");
require("./initializeConfig");
require("./semanticView");
require("./symbolsView");
require("./refactorCode");
function registerCommands(deps) {
    const disp = new atom_1.CompositeDisposable();
    for (const { selector, command, desc } of registry_1.getCommands()) {
        disp.add(atom.commands.add(selector, command, desc(deps)));
    }
    return disp;
}
exports.registerCommands = registerCommands;
//# sourceMappingURL=index.js.map