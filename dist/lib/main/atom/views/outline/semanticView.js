"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const navigationTreeComponent_1 = require("./navigationTreeComponent");
exports.SEMANTIC_VIEW_URI = "atom-typescript://semantic-view";
function deserializeSemanticView(serialized) {
    return SemanticView.create(serialized.data);
}
exports.deserializeSemanticView = deserializeSemanticView;
class SemanticView {
    constructor(config) {
        this.comp = new navigationTreeComponent_1.NavigationTreeComponent({ navTree: config.navTree });
    }
    static create(config) {
        if (!SemanticView.instance)
            SemanticView.instance = new SemanticView(config);
        return SemanticView.instance;
    }
    get element() {
        return this.comp.element;
    }
    setWithTypescriptBuffer(wtb) {
        this.comp.setWithTypescriptBuffer(wtb);
        this.comp.update({});
    }
    getTitle() {
        return "TypeScript";
    }
    getURI() {
        return exports.SEMANTIC_VIEW_URI;
    }
    destroy() {
        SemanticView.instance = null;
        this.comp.destroy();
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
SemanticView.instance = null;
exports.SemanticView = SemanticView;
//# sourceMappingURL=semanticView.js.map