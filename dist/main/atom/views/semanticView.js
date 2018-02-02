"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const semanticViewComponent_1 = require("./semanticViewComponent");
exports.SEMANTIC_VIEW_URI = "atomts-semantic-view";
class SemanticView {
    constructor(config) {
        this.config = config;
        /**
         * This function exists because the react component needs access to `panel` which needs access to `SemanticView`.
         * So we lazily create react component after panel creation
         */
        this.started = false;
        // super(config)
        this.element = document.createElement("div");
        this.element.classList.add("atomts", "atomts-semantic-view", "native-key-bindings");
    }
    get rootDomElement() {
        return this.element;
    }
    start() {
        if (this.started && this.comp) {
            this.comp.forceUpdate();
            return;
        }
        this.started = true;
        this.comp = new semanticViewComponent_1.SemanticViewComponent({ navTree: {} });
        this.comp.componentDidMount(); // TODO is there a hook in etch that gets triggered after initializion finished?
        this.rootDomElement.appendChild(this.comp.refs.main);
    }
    getElement() {
        return this.rootDomElement;
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
            this.comp = null;
        }
        this.element.remove();
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