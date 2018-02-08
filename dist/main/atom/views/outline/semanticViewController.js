"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const semanticView_1 = require("./semanticView");
const atom_2 = require("atom");
class SemanticViewController {
    constructor(view) {
        this.view = view;
        this.subscriptions = new atom_1.CompositeDisposable();
        this.subscriptions.add(new atom_2.Disposable(() => {
            if (this.view) {
                atom.workspace.hide(this.view);
                this.view.destroy();
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
        if (!this.view) {
            // make sure, SemanticView is singleton: check if there is a SemanticView in any Pane
            const pane = atom.workspace.paneForURI(semanticView_1.SemanticView.URI);
            if (pane) {
                this.view = pane.itemForURI(semanticView_1.SemanticView.URI);
            }
            // create new, if none-exists
            if (!this.view) {
                this.view = new semanticView_1.SemanticView({ navTree: null });
            }
        }
        await atom.workspace.open(this.view, { searchAllPanes: true });
    }
    hide() {
        if (!this.view)
            return false;
        else
            return atom.workspace.hide(this.view);
    }
    setView(view) {
        if (this.view) {
            this.view.destroy();
        }
        this.view = view;
    }
}
let mainPane;
function initialize(view) {
    if (!mainPane) {
        mainPane = new SemanticViewController(view);
    }
    else if (view) {
        mainPane.setView(view);
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
        throw new Error("cannot toggle: SemanticViewController not initialized");
    }
}
exports.toggle = toggle;
//# sourceMappingURL=semanticViewController.js.map