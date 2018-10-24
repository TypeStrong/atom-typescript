"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../../utils");
const fileSymbolsView_1 = require("./fileSymbolsView");
const projectSymbolsView_1 = require("./projectSymbolsView");
class SymbolsViewController {
    constructor(deps) {
        this.deps = deps;
    }
    toggleFileView(editor) {
        utils_1.handlePromise(fileSymbolsView_1.toggle(editor, this.deps));
    }
    toggleProjectView(editor) {
        utils_1.handlePromise(projectSymbolsView_1.toggle(editor, this.deps));
    }
    dispose() {
        // TODO: proper disposal
    }
}
exports.SymbolsViewController = SymbolsViewController;
//# sourceMappingURL=symbolsViewController.js.map