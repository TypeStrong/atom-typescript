"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const atom_2 = require("atom");
const utils_1 = require("../../../../utils");
const semanticView_1 = require("./semanticView");
class SemanticViewController {
    constructor(getClient) {
        this.getClient = getClient;
        this.subscriptions = new atom_1.CompositeDisposable();
        const pane = atom.workspace.paneForURI(semanticView_1.SEMANTIC_VIEW_URI);
        if (pane)
            this.view = pane.itemForURI(semanticView_1.SEMANTIC_VIEW_URI);
        if (this.view)
            utils_1.handlePromise(this.view.setGetClient(this.getClient));
        this.subscriptions.add(new atom_2.Disposable(() => {
            if (this.view) {
                atom.workspace.hide(this.view);
                utils_1.handlePromise(this.view.destroy());
            }
        }), atom.config.observe("atom-typescript.showSemanticView", val => {
            if (val)
                utils_1.handlePromise(this.show());
            else
                this.hide();
        }));
    }
    dispose() {
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
            this.view = semanticView_1.SemanticView.create({ navTree: null });
            await this.view.setGetClient(this.getClient);
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
exports.SemanticViewController = SemanticViewController;
//# sourceMappingURL=semanticViewController.js.map