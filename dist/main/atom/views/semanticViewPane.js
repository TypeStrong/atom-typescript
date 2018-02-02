"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const semanticView_1 = require("./semanticView");
class SemanticViewPane {
    constructor() {
        this.isOpen = false;
        this.subscriptions = null;
    }
    activate(state) {
        if (!semanticView_1.SEMANTIC_VIEW_URI && state) {
            // NOTE is is just a dummy to avoid warning of unused variable state
            console.log(state);
        }
        this.subscriptions = new atom_1.CompositeDisposable();
        this.subscriptions.add(atom.workspace.addOpener((uri) => {
            if (uri === "atom://" + semanticView_1.SEMANTIC_VIEW_URI) {
                this.isOpen = true;
                const view = new semanticView_1.SemanticView({});
                view.start();
                return view;
            }
        }));
        this.subscriptions.add({
            dispose() {
                atom.workspace.getPaneItems().forEach(paneItem => {
                    if (paneItem instanceof semanticView_1.SemanticView) {
                        paneItem.destroy();
                    }
                });
            },
        });
        this.subscriptions.add(atom.workspace.onDidAddPaneItem((event) => {
            if (event.item instanceof semanticView_1.SemanticView) {
                this.isOpen = true;
                atom.config.set("atom-typescript.showSemanticView", true);
                // console.log("TypeScript Semantic View was opened")
            }
        }));
        this.subscriptions.add(atom.workspace.onDidDestroyPaneItem((event) => {
            if (event.item instanceof semanticView_1.SemanticView) {
                this.isOpen = false;
                atom.config.set("atom-typescript.showSemanticView", false);
                // console.log("TypeScript Semantic View was closed")
            }
        }));
        this.subscriptions.add(atom.config.onDidChange("atom-typescript.showSemanticView", (val) => {
            this.show(val.newValue);
        }));
        this.show(atom.config.get("atom-typescript.showSemanticView"));
    }
    deactivate() {
        if (this.subscriptions !== null) {
            this.subscriptions.dispose();
        }
    }
    toggle() {
        // console.log("TypeScript Semantic View was toggled")
        atom.workspace.toggle("atom://" + semanticView_1.SEMANTIC_VIEW_URI);
    }
    show(isShow) {
        if (isShow === false) {
            this.hide();
            return;
        }
        // console.log("TypeScript Semantic View was opened")
        atom.workspace.open("atom://" + semanticView_1.SEMANTIC_VIEW_URI, {});
    }
    hide(isHide) {
        if (isHide === false) {
            this.show();
            return;
        }
        // console.log("TypeScript Semantic View was hidden")
        atom.workspace.hide("atom://" + semanticView_1.SEMANTIC_VIEW_URI);
    }
}
exports.SemanticViewPane = SemanticViewPane;
function attach() {
    // Only attach once
    if (!exports.mainPane) {
        exports.mainPane = new SemanticViewPane();
        exports.mainPane.activate({});
    }
    return {
        dispose() {
            exports.mainPane.deactivate();
        },
        semanticView: exports.mainPane,
    };
}
exports.attach = attach;
function toggle() {
    if (exports.mainPane) {
        exports.mainPane.toggle();
    }
    else {
        console.log(`cannot toggle: ${semanticView_1.SEMANTIC_VIEW_URI} not initialized`);
    }
}
exports.toggle = toggle;
//# sourceMappingURL=semanticViewPane.js.map