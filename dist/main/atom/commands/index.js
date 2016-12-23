"use strict";
const registry_1 = require("./registry");
require("./build");
require("./checkAllFiles");
require("./clearErrors");
require("./findReferences");
require("./goToDeclaration");
function registerCommands(deps) {
    for (const [name, command] of registry_1.commands) {
        atom.commands.add("atom-workspace", name, command(deps));
    }
    atom.commands.add('atom-workspace', 'typescript:sync', (e) => {
        console.log("typescript:sync trigerred");
    });
}
exports.registerCommands = registerCommands;
