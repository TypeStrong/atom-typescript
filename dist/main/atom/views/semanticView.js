"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const semanticViewComponent_1 = require("./semanticViewComponent");
exports.SEMANTIC_VIEW_URI = "atomts-semantic-view";
class SemanticView {
    constructor(config) {
        this.config = config;
        this.comp = new semanticViewComponent_1.SemanticViewComponent({ navTree: null });
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
}
exports.SemanticView = SemanticView;
//# sourceMappingURL=semanticView.js.map