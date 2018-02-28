"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fileSymbolsView_1 = require("./fileSymbolsView");
const projectSymbolsView_1 = require("./projectSymbolsView");
class SymbolsViewController {
    constructor(deps) {
        this.deps = deps;
    }
    toggleFileView(editor) {
        fileSymbolsView_1.toggle(editor, this.deps);
    }
    toggleProjectView(editor) {
        projectSymbolsView_1.toggle(editor, this.deps);
    }
    dispose() {
        // TODO: proper disposal
    }
}
exports.SymbolsViewController = SymbolsViewController;
//# sourceMappingURL=symbolsViewController.js.map