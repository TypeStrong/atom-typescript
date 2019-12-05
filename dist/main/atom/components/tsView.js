"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
class TsView {
    constructor(props) {
        this.props = props;
        etch.initialize(this);
    }
    async update(props) {
        this.props = Object.assign(Object.assign({}, this.props), props);
        return etch.update(this);
    }
    render() {
        const style = {
            fontFamily: atom.config.get("editor.fontFamily"),
        };
        return (etch.dom("div", { className: "editor editor-colors", style: style, innerHTML: this.props.highlightedText }));
    }
}
exports.TsView = TsView;
//# sourceMappingURL=tsView.js.map