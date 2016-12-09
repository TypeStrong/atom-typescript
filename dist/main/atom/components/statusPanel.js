"use strict";
const dom = require("../../utils/dom");
let span = dom.createElement("span", { ref: el => console.log("el be", el) });
console.log("x", span);
class StatusPanel extends HTMLElement {
    createdCallback() {
        this.appendChild(dom.createElement("div", { className: "inline-block ts-status-version" }, "2.2.0-15072987"));
        this.appendChild(dom.createElement("div", { className: "inline-block ts-status-pending" },
            dom.createElement("span", { className: "ts-status-pending-count" }, "3"),
            dom.createElement("span", { className: "loading loading-spinner-tiny inline-block", style: { marginLeft: 5 } })));
    }
    attachedCallback() {
        console.log("attached");
    }
    attributeChangedCallback() {
        console.log("attrs changed", arguments);
    }
    show() {
        this.style.display = "block";
    }
    hide() {
        this.style.display = "none";
    }
    static create() {
        return document.createElement("ts-status-panel");
    }
}
exports.StatusPanel = StatusPanel;
document.registerElement('ts-status-panel', StatusPanel);
