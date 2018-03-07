"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
class TooltipView {
    constructor() {
        this.props = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            text: "",
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
        const offset = 10;
        let left = this.props.right;
        let top = this.props.bottom;
        let right = false;
        let whiteSpace = "";
        const clientWidth = document.body.clientWidth;
        const offsetWidth = this.element.offsetWidth;
        const clientHeight = document.body.clientHeight;
        const offsetHeight = this.element.offsetHeight;
        // X axis adjust
        if (left + offsetWidth >= clientWidth) {
            left = clientWidth - offsetWidth - offset;
        }
        if (left < 0) {
            whiteSpace = "pre-wrap";
            left = offset;
            right = offset;
        }
        // Y axis adjust
        if (top + offsetHeight >= clientHeight) {
            top = this.props.top - offsetHeight;
        }
        this.element.style.left = `${left}px`;
        this.element.style.top = `${top}px`;
        if (right !== false)
            this.element.style.right = `${right}px`;
        if (whiteSpace)
            this.element.style.whiteSpace = whiteSpace;
    }
    render() {
        return (etch.dom("div", { class: "atom-typescript-tooltip tooltip" },
            etch.dom("div", { class: "tooltip-inner", innerHTML: this.props.text })));
    }
}
exports.TooltipView = TooltipView;
//# sourceMappingURL=tooltipView.js.map