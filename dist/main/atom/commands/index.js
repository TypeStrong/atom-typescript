"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
const atom_1 = require("atom");
const utils_1 = require("../utils");
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
require("./organizeImports");
function registerCommands(deps) {
    const disp = new atom_1.CompositeDisposable();
    for (const cmd of registry_1.getCommands()) {
        if (cmd.selector === "atom-text-editor") {
            const d = cmd.desc(deps);
            disp.add(atom.commands.add(cmd.selector, cmd.command, Object.assign({}, d, { async didDispatch(e) {
                    try {
                        const editor = e.currentTarget.getModel();
                        if (utils_1.isTypescriptEditorWithPath(editor)) {
                            await d.didDispatch(editor, () => e.abortKeyBinding());
                        }
                        else {
                            e.abortKeyBinding();
                            if (utils_1.isTypescriptGrammar(editor)) {
                                atom.notifications.addWarning("Atom-TypeScript cancelled last command: Current editor has no file path", {
                                    description: "Atom-TypeScript needs to determine the file path of the " +
                                        `current editor to execute \`${cmd.command}\`, which it failed to do. ` +
                                        "You probably just need to save the current file somewhere.",
                                    dismissable: true,
                                });
                            }
                        }
                    }
                    catch (error) {
                        handle(error);
                    }
                } })));
        }
        else {
            const d = cmd.desc(deps);
            atom.commands.add(cmd.selector, cmd.command, Object.assign({}, d, { async didDispatch() {
                    try {
                        await d.didDispatch();
                    }
                    catch (error) {
                        handle(error);
                    }
                } }));
        }
    }
    return disp;
}
exports.registerCommands = registerCommands;
function handle(err) {
    atom.notifications.addFatalError("Something went wrong, see details below.", {
        detail: err.message,
        dismissable: true,
        stack: err.stack,
    });
}
//# sourceMappingURL=index.js.map