"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fileSymbolsView_1 = require("./fileSymbolsView");
const projectSymbolsView_1 = require("./projectSymbolsView");
/**
 * this is a slightly modified copy of symbols-view/lib/main.js
 * for support of searching file-symbols in typescript files.
 */
class SymbolsViewController {
    constructor(clientResolver) {
        this.clientResolver = clientResolver;
        this.stack = [];
    }
    activate() {
        // NOTE commands are registered via
        //        commands/**SybmolsView.ts
        //      and commands/index.ts
    }
    deactivate() {
        if (this.fileView != null) {
            this.fileView.destroy();
            this.fileView = null;
        }
        if (this.projectView != null) {
            this.projectView.destroy();
            this.projectView = null;
        }
    }
    createFileView() {
        if (this.fileView) {
            return this.fileView;
        }
        // const FileView  = require('./fileSymbolsView');
        this.fileView = new fileSymbolsView_1.FileView(this.stack, this.clientResolver);
        return this.fileView;
    }
    createProjectView() {
        if (this.projectView) {
            return this.projectView;
        }
        // const ProjectView  = require('./project-view');
        this.projectView = new projectSymbolsView_1.default(this.stack, this.clientResolver);
        return this.projectView;
    }
    toggleFileView() {
        this.createFileView().toggle();
    }
    toggleProjectView() {
        this.createProjectView().toggle();
    }
    dispose() {
        this.deactivate();
    }
}
exports.SymbolsViewController = SymbolsViewController;
//# sourceMappingURL=symbolsViewController.js.map