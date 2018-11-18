"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
const util_1 = require("./util");
class TooltipView {
    constructor() {
        this.props = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
        };
        etch.initialize(this);
    }
    async destroy() {
        return etch.destroy(this);
    }
    async update(props) {
        this.props = Object.assign({}, this.props, props);
        await etch.update(this);
    }
    writeAfterUpdate() {
        util_1.adjustElementPosition(this.element, document.body, this.props, atom.config.get("atom-typescript").tooltipPosition);
    }
    render() {
        return (etch.dom("div", { class: "atom-typescript-tooltip tooltip" },
            etch.dom("div", { class: "tooltip-inner" }, this.tooltipContents())));
    }
    tooltipContents() {
        if (!this.props.info)
            return "…";
        const code = (etch.dom("div", { class: "atom-typescript-tooltip-tooltip-code" }, this.props.info.displayString));
        const docs = this.props.info.documentation ? (etch.dom("div", { class: "atom-typescript-tooltip-tooltip-doc" }, this.props.info.documentation)) : null;
        return [code, docs];
    }
}
exports.TooltipView = TooltipView;
//# sourceMappingURL=tooltipView.js.map