"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
const util_1 = require("../tooltips/util");
const utils_1 = require("../utils");
class TooltipView {
    constructor(parent) {
        this.parent = parent;
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
        util_1.adjustElementPosition(this.element, this.parent, this.props, atom.config.get("atom-typescript").sigHelpPosition);
    }
    render() {
        return (etch.dom("div", { class: "atom-typescript-tooltip tooltip", key: this.sigHelpHash() },
            etch.dom("div", { class: "tooltip-inner" }, this.tooltipContents())));
    }
    sigHelpHash() {
        if (!this.props.sigHelp)
            return undefined;
        const { start, end } = this.props.sigHelp.applicableSpan;
        return `${start.line}:${start.offset}-${end.line}:${end.offset}`;
    }
    tooltipContents() {
        if (!this.props.sigHelp)
            return "…";
        const { sigHelp } = this.props;
        return sigHelp.items.map((sig, idx) => (etch.dom("div", { class: `atom-typescript-tooltip-signature-help${idx === sigHelp.selectedItemIndex
                ? " atom-typescript-tooltip-signature-help-selected"
                : ""}` },
            utils_1.partsToStr(sig.prefixDisplayParts),
            this.renderSigHelpParams(sig.parameters, sigHelp.argumentIndex),
            utils_1.partsToStr(sig.suffixDisplayParts),
            etch.dom("div", { class: "atom-typescript-tooltip-signature-help-documentation" }, utils_1.partsToStr(sig.documentation)))));
    }
    renderSigHelpParams(params, selIdx) {
        return params.map((p, i) => (etch.dom("span", { class: `atom-typescript-tooltip-signature-help-parameter` },
            i > 0 ? ", " : null,
            etch.dom("span", { class: i === selIdx ? "atom-typescript-tooltip-signature-help-selected" : undefined }, utils_1.partsToStr(p.displayParts)))));
    }
}
exports.TooltipView = TooltipView;
//# sourceMappingURL=tooltipView.js.map