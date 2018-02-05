"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const navigationTreeComponent_1 = require("./navigationTreeComponent");
exports.SEMANTIC_VIEW_URI = "atomts-semantic-view";
function deserializeSemanticView(serialized) {
    return new SemanticView(serialized.data);
}
exports.deserializeSemanticView = deserializeSemanticView;
class SemanticView {
    constructor(config) {
        this.config = config;
        this.comp = new navigationTreeComponent_1.NavigationTreeComponent({ navTree: (config && config.navTree) || null });
    }
    get element() {
        return this.comp.element;
    }
    getTitle() {
        return "TypeScript";
    }
    getURI() {
        return "atom://" + exports.SEMANTIC_VIEW_URI;
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
exports.SemanticView = SemanticView;
//# sourceMappingURL=semanticView.js.map