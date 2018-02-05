"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fileSymbolsView_1 = require("./fileSymbolsView");
/**
 * this is a slightly modified copy of symbols-view/lib/main.js
 * for support of searching file-symbols in typescript files.
 */
class FileSymbolsView {
    constructor() {
        this.editorSubscription = null;
    }
    activate() {
        this.stack = [];
        // FIXME registry.ts does not work (yet?) -> when it does, this must be removed/disabled
        this.editorSubscription = atom.commands.add("atom-text-editor", {
            "typescript:toggle-file-symbols": () => {
                this.createFileView().toggle();
            },
        });
    }
    deactivate() {
        if (this.fileView != null) {
            this.fileView.destroy();
            this.fileView = null;
        }
        if (this.editorSubscription != null) {
            this.editorSubscription.dispose();
            this.editorSubscription = null;
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
function toggle() {
    if (exports.mainPane) {
        exports.mainPane.createFileView().toggle();
    }
    else {
        console.log(`cannot toggle: typescript:toggle-file-symbols not initialized`);
    }
}
exports.toggle = toggle;
//# sourceMappingURL=symbolsViewMain.js.map