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
        var _a, _b, _c;
        if (((_a = props.sigHelp) === null || _a === void 0 ? void 0 : _a.selectedItemIndex) !== undefined &&
            ((_b = props.sigHelp) === null || _b === void 0 ? void 0 : _b.selectedItemIndex) !== ((_c = this.props.sigHelp) === null || _c === void 0 ? void 0 : _c.selectedItemIndex)) {
            this.props.visibleItem = undefined;
        }
        this.props = Object.assign(Object.assign({}, this.props), props);
        if (this.props.sigHelp === undefined) {
            this.props.visibleItem = undefined;
        }
        else if (this.props.visibleItem !== undefined) {
            this.props.visibleItem = this.props.visibleItem % this.props.sigHelp.items.length;
            if (this.props.visibleItem < 0)
                this.props.visibleItem += this.props.sigHelp.items.length;
        }
        await etch.update(this);
    }
    writeAfterUpdate() {
        util_1.adjustElementPosition(this.element, this.parent, this.props, atom.config.get("atom-typescript").sigHelpPosition);
    }
    render() {
        return (etch.dom("div", { className: "atom-typescript-tooltip tooltip", key: this.sigHelpHash() },
            etch.dom("div", { className: "tooltip-inner" }, this.tooltipContents())));
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
        const visibleItem = this.props.visibleItem !== undefined ? this.props.visibleItem : sigHelp.selectedItemIndex;
        const count = sigHelp.items.length;
        const classes = ["atom-typescript-tooltip-signature-help"];
        if (count > 1) {
            classes.push("atom-typescript-tooltip-signature-help-changable");
        }
        function className(idx) {
            const newclasses = [];
            if (idx === sigHelp.selectedItemIndex) {
                newclasses.push("atom-typescript-tooltip-signature-help-selected");
            }
            if (idx === visibleItem) {
                newclasses.push("atom-typescript-tooltip-signature-help-visible");
            }
            return [...classes, ...newclasses].join(" ");
        }
        return sigHelp.items.map((sig, idx) => (etch.dom("div", { className: className(idx) },
            etch.dom("div", null,
                utils_1.partsToStr(sig.prefixDisplayParts),
                this.renderSigHelpParams(sig.parameters, sigHelp.argumentIndex),
                utils_1.partsToStr(sig.suffixDisplayParts),
                etch.dom("div", { className: "atom-typescript-tooltip-signature-help-documentation" }, utils_1.partsToStr(sig.documentation))))));
    }
    renderSigHelpParams(params, selIdx) {
        return params.map((p, i) => (etch.dom("span", { className: `atom-typescript-tooltip-signature-help-parameter` },
            i > 0 ? ", " : null,
            etch.dom("span", { className: i === selIdx ? "atom-typescript-tooltip-signature-help-selected" : undefined }, utils_1.partsToStr(p.displayParts)))));
    }
}
exports.TooltipView = TooltipView;
//# sourceMappingURL=tooltipView.js.map