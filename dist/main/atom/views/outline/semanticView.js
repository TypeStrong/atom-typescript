"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const navigationTreeComponent_1 = require("./navigationTreeComponent");
const semanticViewController_1 = require("./semanticViewController");
exports.SEMANTIC_VIEW_URI = "atomts-semantic-view";
function deserializeSemanticView(serialized) {
    // console.log('deserializeSemanticView -> ', serialized)// DEBUG
    const view = new SemanticView(serialized.data);
    semanticViewController_1.initialize(view);
    return view;
}
exports.deserializeSemanticView = deserializeSemanticView;
class SemanticView {
    constructor(config) {
        this.config = config;
        this.comp = new navigationTreeComponent_1.NavigationTreeComponent({ navTree: config.navTree || null });
    }
    get element() {
        return this.comp.element;
    }
    getTitle() {
        return "TypeScript";
    }
    getURI() {
        return SemanticView.URI;
    }
    // Tear down any state and detach
    destroy() {
        if (this.comp) {
            this.comp.destroy();
        }
    }
    getDefaultLocation() {
        return "right";
    }
    getAllowedLocations() {
        // The locations into which the item can be moved.
        return ["left", "right"];
    }
    serialize() {
        // console.log("SemanticView.serialize()") // DEBUG
        return {
            deserializer: "atomts-semantic-view/SemanticView",
            data: { navTree: this.comp.props.navTree },
        };
    }
}
SemanticView.URI = "atom://" + exports.SEMANTIC_VIEW_URI;
exports.SemanticView = SemanticView;
//# sourceMappingURL=semanticView.js.map