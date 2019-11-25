"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
const tooltipRenderer_1 = require("./tooltipRenderer");
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
        this.props = Object.assign(Object.assign({}, this.props), props);
        await etch.update(this);
    }
    writeAfterUpdate() {
        util_1.adjustElementPosition(this.element, document.body, this.props, atom.config.get("atom-typescript").tooltipPosition);
    }
    render() {
        const [kind, docs] = this.props.info ? tooltipRenderer_1.renderTooltip(this.props.info, etch) : [null, null];
        return (etch.dom("div", { className: "atom-typescript-tooltip tooltip" },
            etch.dom("div", { className: "tooltip-inner" },
                kind,
                docs)));
    }
}
exports.TooltipView = TooltipView;
//# sourceMappingURL=tooltipView.js.map