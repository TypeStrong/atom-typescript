"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
const tooltip_1 = require("./tooltip");
class Pending {
    constructor(props) {
        this.props = Object.assign({}, props);
        etch.initialize(this);
    }
    async update(props) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.props = Object.assign({}, this.props, props);
        await etch.update(this);
    }
    render() {
        return (etch.dom(tooltip_1.Tooltip, { title: `Pending Requests: <ul>${this.props.pending
                .map(x => `<li>${x}</li>`)
                .join("")}</ul>`, html: true },
            etch.dom("span", { ref: "pendingCounter" }, this.props.pending.length.toString()),
            etch.dom("span", { ref: "pendingSpinner", className: "loading loading-spinner-tiny inline-block", style: { marginLeft: "5px", opacity: "0.5", verticalAlign: "sub" } })));
    }
    async destroy() {
        await etch.destroy(this);
    }
}
exports.Pending = Pending;
//# sourceMappingURL=pending.js.map