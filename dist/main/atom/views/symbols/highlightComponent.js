"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
class HighlightComponent {
    constructor(props) {
        this.props = props;
        etch.initialize(this);
    }
    async update(props) {
        this.props = Object.assign({}, this.props, props);
        await etch.update(this);
    }
    async destroy() {
        await etch.destroy(this);
    }
    render() {
        return (etch.dom("div", { class: this.props.styleClass || "" }, this.props.matches.map(match => etch.dom("span", { class: match.type || "" }, match.text))));
    }
}
exports.HighlightComponent = HighlightComponent;
//# sourceMappingURL=highlightComponent.js.map