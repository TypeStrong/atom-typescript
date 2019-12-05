"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
const tooltipRenderer_1 = require("./tooltipRenderer");
const util_1 = require("./util");
class TooltipView {
    constructor() {
        this.tooltip = null;
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
        this.props = Object.assign(Object.assign({}, this.props), props);
        this.tooltip = await tooltipRenderer_1.renderTooltip(this.props.info, etch, x => (etch.dom("div", { className: "atom-typescript-tooltip-tooltip-code" }, x)));
        await etch.update(this);
    }
    writeAfterUpdate() {
        util_1.adjustElementPosition(this.element, document.body, this.props, atom.config.get("atom-typescript").tooltipPosition);
    }
    render() {
        return (etch.dom("div", { className: "atom-typescript-tooltip tooltip" },
            etch.dom("div", { className: "tooltip-inner" }, this.tooltip)));
    }
}
exports.TooltipView = TooltipView;
//# sourceMappingURL=tooltipView.js.map