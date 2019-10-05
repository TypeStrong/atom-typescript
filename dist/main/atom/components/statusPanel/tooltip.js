"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
class Tooltip {
    constructor(props, children) {
        this.children = children;
        this.props = Object.assign(Object.assign({}, props), { delay: { show: 0, hide: 0 } });
        etch.initialize(this);
        this.tooltipDisposable = atom.tooltips.add(this.element, this.props);
    }
    async update(props, children) {
        this.props = Object.assign(Object.assign({}, this.props), props);
        this.children = children;
        await etch.update(this);
        this.tooltipDisposable.dispose();
        this.tooltipDisposable = atom.tooltips.add(this.element, this.props);
    }
    render() {
        return etch.dom("div", { className: "inline-block" }, this.children ? this.children : null);
    }
    async destroy() {
        await etch.destroy(this);
        this.tooltipDisposable.dispose();
    }
}
exports.Tooltip = Tooltip;
//# sourceMappingURL=tooltip.js.map