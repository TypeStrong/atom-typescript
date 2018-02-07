"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fileSymbolsView_1 = require("./fileSymbolsView");
const projectSymbolsView_1 = require("./projectSymbolsView");
/**
 * this is a slightly modified copy of symbols-view/lib/main.js
 * for support of searching file-symbols in typescript files.
 */
class FileSymbolsView {
    activate() {
        this.stack = [];
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
        this.fileView = new fileSymbolsView_1.FileView(this.stack);
        return this.fileView;
    }
    createProjectView() {
        if (this.projectView) {
            return this.projectView;
        }
        // const ProjectView  = require('./project-view');
        this.projectView = new projectSymbolsView_1.default(this.stack);
        return this.projectView;
    }
}
exports.FileSymbolsView = FileSymbolsView;
function initialize() {
    // Only attach once
    if (!exports.mainPane) {
        exports.mainPane = new FileSymbolsView();
        exports.mainPane.activate();
    }
    return {
        dispose() {
            exports.mainPane.deactivate();
        },
        fileSymbolsView: exports.mainPane,
    };
}
exports.initialize = initialize;
function toggleFileSymbols() {
    if (exports.mainPane) {
        exports.mainPane.createFileView().toggle();
    }
    else {
        console.log(`cannot toggle: typescript:toggle-file-symbols not initialized`);
    }
}
exports.toggleFileSymbols = toggleFileSymbols;
function toggleProjectSymbols() {
    if (exports.mainPane) {
        exports.mainPane.createProjectView().toggle();
    }
    else {
        console.log(`cannot toggle: typescript:toggle-project-symbols not initialized`);
    }
}
exports.toggleProjectSymbols = toggleProjectSymbols;
//# sourceMappingURL=symbolsViewMain.js.map