"use strict";
const tslib_1 = require("tslib");
class StatusPanel extends HTMLElement {
    createdCallback() {
        console.log("created");
        this.innerHTML = "Ay karamba!";
    }
    attachedCallback() {
        console.log("attached");
    }
    attributeChangedCallback() {
        console.log("attrs changed", arguments);
    }
}
exports.StatusPanel = StatusPanel;
document.registerElement('ts-status-panel', StatusPanel);
