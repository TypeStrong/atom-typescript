"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const navigationTreeComponent_1 = require("./navigationTreeComponent");
exports.SEMANTIC_VIEW_URI = "atom-typescript://semantic-view";
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
    async setGetClient(gc) {
        await this.comp.setGetClient(gc);
        await this.comp.update({});
    }
    getTitle() {
        return "TypeScript";
    }
    getURI() {
        return exports.SEMANTIC_VIEW_URI;
    }
    async destroy() {
        SemanticView.instance = null;
        await this.comp.destroy();
    }
    getDefaultLocation() {
        return "right";
    }
    getAllowedLocations() {
        // The locations into which the item can be moved.
        return ["left", "right"];
    }
    serialize() {
        return {
            deserializer: "atomts-semantic-view/SemanticView",
            data: { navTree: this.comp.props.navTree },
        };
    }
}
exports.SemanticView = SemanticView;
SemanticView.instance = null;
//# sourceMappingURL=semanticView.js.map