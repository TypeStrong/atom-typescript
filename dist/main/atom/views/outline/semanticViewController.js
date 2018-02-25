"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const semanticView_1 = require("./semanticView");
const atom_2 = require("atom");
class SemanticViewController {
    constructor(clientResolver) {
        this.clientResolver = clientResolver;
        this.subscriptions = new atom_1.CompositeDisposable();
        const pane = atom.workspace.paneForURI(semanticView_1.SEMANTIC_VIEW_URI);
        if (pane)
            this.view = pane.itemForURI(semanticView_1.SEMANTIC_VIEW_URI);
        if (this.view)
            this.view.setClientResolver(this.clientResolver);
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
    static create(clientResolver) {
        if (!SemanticViewController.instance) {
            SemanticViewController.instance = new SemanticViewController(clientResolver);
        }
        return SemanticViewController.instance;
    }
    static async toggle() {
        if (SemanticViewController.instance) {
            return SemanticViewController.instance.toggleImpl();
        }
        else {
            throw new Error("cannot toggle: SemanticViewController not initialized");
        }
    }
    dispose() {
        this.subscriptions.dispose();
        SemanticViewController.instance = null;
    }
    async toggleImpl() {
        if (!this.view)
            await this.show();
        else
            await atom.workspace.toggle(this.view);
    }
    async show() {
        if (!this.view) {
            this.view = semanticView_1.SemanticView.create({ navTree: null });
            this.view.setClientResolver(this.clientResolver);
        }
        await atom.workspace.open(this.view, { searchAllPanes: true });
    }
    hide() {
        if (!this.view)
            return false;
        else
            return atom.workspace.hide(this.view);
    }
}
SemanticViewController.instance = null;
exports.SemanticViewController = SemanticViewController;
//# sourceMappingURL=semanticViewController.js.map