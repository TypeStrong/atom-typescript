"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const semanticView_1 = require("./semanticView");
const atom_2 = require("atom");
class SemanticViewController {
    constructor() {
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
    static create() {
        if (!SemanticViewController.instance) {
            SemanticViewController.instance = new SemanticViewController();
        }
        return SemanticViewController.instance;
    }
    dispose() {
        this.subscriptions.dispose();
    }
    static async toggle() {
        if (SemanticViewController.instance) {
            return SemanticViewController.instance.toggleImpl();
        }
        else {
            throw new Error("cannot toggle: SemanticViewController not initialized");
        }
    }
    async toggleImpl() {
        if (!this.view)
            await this.show();
        else
            await atom.workspace.toggle(this.view);
    }
    async show() {
        if (!this.view)
            this.view = semanticView_1.SemanticView.create({ navTree: null });
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
SemanticViewController.instance = null;
exports.SemanticViewController = SemanticViewController;
//# sourceMappingURL=semanticViewController.js.map