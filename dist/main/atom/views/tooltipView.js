"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const etch = require("etch");
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
    destroy() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return etch.destroy(this);
        });
    }
    update(props) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.props = Object.assign({}, this.props, props);
            yield etch.update(this);
        });
    }
    writeAfterUpdate() {
        const offset = 10;
        let left = this.props.right;
        let top = this.props.bottom;
        let right = false;
        let whiteSpace = "";
        const clientWidth = document.body.clientWidth;
        const offsetWidth = this.refs.main.offsetWidth;
        const clientHeight = document.body.clientHeight;
        const offsetHeight = this.refs.main.offsetHeight;
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
        this.refs.main.style.left = `${left}px`;
        this.refs.main.style.top = `${top}px`;
        if (right !== false)
            this.refs.main.style.right = `${right}px`;
        if (whiteSpace)
            this.refs.main.style.whiteSpace = whiteSpace;
    }
    render() {
        return (etch.dom("div", { ref: "main", class: "atom-typescript-tooltip tooltip" },
            etch.dom("div", { class: "tooltip-inner", innerHTML: this.props.text || "" })));
    }
}
exports.TooltipView = TooltipView;
//# sourceMappingURL=tooltipView.js.map