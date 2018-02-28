"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
const utils_1 = require("./utils");
class HighlightComponent {
    constructor(props) {
        this.props = props;
        this.matches = this.match(this.props);
        etch.initialize(this);
    }
    async update(props) {
        this.props = Object.assign({}, this.props, props);
        this.matches = this.match(this.props);
        await etch.update(this);
    }
    async destroy() {
        await etch.destroy(this);
    }
    render() {
        return etch.dom("span", null, this.matches.map(match => etch.dom("span", { class: match.type }, match.text)));
    }
    match(props) {
        if (props.query) {
            return utils_1.highlightMatches(props.label, props.query);
        }
        return [{ text: props.label }];
    }
}
exports.HighlightComponent = HighlightComponent;
//# sourceMappingURL=highlightComponent.js.map