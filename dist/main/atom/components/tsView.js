"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const highlight = require("atom-highlight");
const etch = require("etch");
class TsView {
    constructor(props) {
        this.props = props;
        etch.initialize(this);
    }
    async update(props) {
        this.props = Object.assign({}, this.props, props);
        return etch.update(this);
    }
    render() {
        const html = highlight({
            fileContents: this.props.text,
            scopeName: "source.tsx",
            editorDiv: false,
            wrapCode: false,
            nbsp: false,
            lineDivs: false,
        });
        const style = {
            fontFamily: atom.config.get("editor.fontFamily"),
        };
        return etch.dom("div", { class: "editor editor-colors", style: style, innerHTML: html });
    }
}
exports.TsView = TsView;
//# sourceMappingURL=tsView.js.map