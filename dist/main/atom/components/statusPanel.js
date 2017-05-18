"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dom = require("jsx-render-dom");
const path_1 = require("path");
const utils_1 = require("../utils");
class StatusPanel extends HTMLElement {
    createdCallback() {
        const nodes = [
            dom.createElement("div", { ref: el => this.version = el, className: "inline-block" }),
            dom.createElement("a", { ref: el => this.pendingContainer = el, className: "inline-block", href: "", onClick: evt => {
                    evt.preventDefault();
                    this.showPendingRequests();
                } },
                dom.createElement("span", { ref: span => this.pendingCounter = span }),
                dom.createElement("span", { ref: span => this.pendingSpinner = span, className: "loading loading-spinner-tiny inline-block", style: { marginLeft: "5px", opacity: 0.5, verticalAlign: "sub" } })),
            dom.createElement("a", { ref: el => this.configPathContainer = el, className: "inline-block", href: "", onClick: evt => {
                    evt.preventDefault();
                    this.openConfigPath();
                } }),
            dom.createElement("div", { ref: el => this.statusContainer = el, className: "inline-block" },
                dom.createElement("span", { ref: el => this.statusText = el })),
            dom.createElement("progress", { ref: el => this.progress = el, style: { verticalAlign: "baseline" }, className: 'inline-block' })
        ];
        for (const node of nodes) {
            this.appendChild(node);
        }
        this.setVersion(undefined);
        this.setPending([], true);
        this.setTsConfigPath(undefined);
        this.setBuildStatus(undefined);
        this.setProgress(undefined);
    }
    dispose() {
        this.remove();
    }
    openConfigPath() {
        if (this.configPath && !this.configPath.startsWith("/dev/null")) {
            utils_1.openFile(this.configPath);
        }
        else {
            atom.notifications.addInfo("No tsconfig for current file");
        }
    }
    setBuildStatus(status) {
        const container = this.statusText;
        if (status) {
            if (status.success) {
                container.classList.remove("highlight-error");
                container.classList.add("highlight-success");
                container.textContent = "Emit Success";
            }
            else {
                container.classList.add("highlight-error");
                container.classList.remove("highlight-success");
                container.textContent = "Emit Failed";
            }
            this.statusContainer.classList.remove("hide");
        }
        else {
            this.statusContainer.classList.add("hide");
        }
    }
    setProgress(progress) {
        if (progress) {
            this.progress.max = progress.max;
            this.progress.value = progress.value;
            this.progress.classList.remove("hide");
        }
        else {
            this.progress.classList.add("hide");
        }
    }
    setTsConfigPath(configPath) {
        this.configPath = configPath;
        if (configPath) {
            this.configPathContainer.textContent = configPath.startsWith("/dev/null") ? "No project" :
                path_1.dirname(utils_1.getFilePathRelativeToAtomProject(configPath));
            this.configPathContainer.classList.remove("hide");
        }
        else {
            this.configPathContainer.classList.add("hide");
        }
    }
    setVersion(version) {
        if (version) {
            this.version.textContent = version;
            this.version.classList.remove("hide");
        }
        else {
            this.version.classList.add("hide");
        }
    }
    _setPending(pending) {
        this.pendingRequests = pending;
        if (pending.length) {
            this.pendingContainer.classList.remove("hide");
            this.pendingCounter.textContent = pending.length.toString();
        }
        else {
            this.pendingContainer.classList.add("hide");
        }
    }
    setPending(pending, immediate = false) {
        const timeout = immediate ? 0 : 100;
        clearTimeout(this.pendingTimeout);
        this.pendingTimeout = setTimeout(() => this._setPending(pending), timeout);
    }
    showPendingRequests() {
        if (this.pendingRequests) {
            atom.notifications.addInfo("Pending Requests: <br/> - " + this.pendingRequests.join("<br/> - "));
        }
    }
    show() {
        this.classList.remove("hide");
    }
    hide() {
        this.classList.add("hide");
    }
    static create() {
        return document.createElement("ts-status-panel");
    }
}
exports.StatusPanel = StatusPanel;
document.registerElement('ts-status-panel', StatusPanel);
//# sourceMappingURL=statusPanel.js.map