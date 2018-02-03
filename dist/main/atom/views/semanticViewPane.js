"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const semanticView_1 = require("./semanticView");
const atom_2 = require("atom");
class SemanticViewPane {
    constructor() {
        this.subscriptions = new atom_1.CompositeDisposable();
        this.subscriptions.add(new atom_2.Disposable(() => {
            if (this.view) {
                atom.workspace.hide(this.view);
                this.view.destroy();
            }
        }), atom.workspace.onDidAddPaneItem((event) => {
            if (event.item instanceof semanticView_1.SemanticView) {
                atom.config.set("atom-typescript.showSemanticView", true);
            }
        }), atom.workspace.onDidDestroyPaneItem((event) => {
            if (event.item instanceof semanticView_1.SemanticView) {
                atom.config.set("atom-typescript.showSemanticView", false);
            }
        }), atom.config.observe("atom-typescript.showSemanticView", val => {
            if (val)
                this.show();
            else
                this.hide();
        }));
    }
    destroy() {
        this.subscriptions.dispose();
    }
    async toggle() {
        if (!this.view)
            await this.show();
        else
            await atom.workspace.toggle(this.view);
    }
    async show() {
        if (!this.view)
            this.view = new semanticView_1.SemanticView({});
        await atom.workspace.open(this.view, { searchAllPanes: true });
    }
    hide() {
        if (!this.view)
            return false;
        else
            return atom.workspace.hide(this.view);
    }
}
let mainPane;
function initialize() {
    // Only attach once
    if (!mainPane) {
        mainPane = new SemanticViewPane();
    }
    const pane = mainPane;
    return new atom_2.Disposable(() => {
        pane.destroy();
    });
}
exports.initialize = initialize;
function toggle() {
    if (mainPane) {
        mainPane.toggle();
    }
    else {
        throw new Error("cannot toggle: SemanticViewPane not initialized");
    }
}
exports.toggle = toggle;
//# sourceMappingURL=semanticViewPane.js.map