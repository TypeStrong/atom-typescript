"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
const path_1 = require("path");
const utils_1 = require("../utils");
class StatusPanel {
    constructor(props = {}) {
        this.buildStatusClicked = () => {
            if (this.props.buildStatus && !this.props.buildStatus.success) {
                atom.notifications.addError("Build failed", {
                    detail: this.props.buildStatus.message,
                    dismissable: true,
                });
            }
        };
        this.props = Object.assign({ visible: true }, props);
        etch.initialize(this);
        this.resetBuildStatusTimeout();
    }
    async update(props) {
        this.props = Object.assign({}, this.props, props);
        this.resetBuildStatusTimeout();
        await etch.update(this);
    }
    render() {
        return (etch.dom("ts-status-panel", { className: this.props.visible ? "" : "hide" },
            this.renderVersion(),
            this.renderPending(),
            this.renderConfigPath(),
            this.renderStatus(),
            this.renderProgress()));
    }
    async destroy() {
        await etch.destroy(this);
    }
    dispose() {
        this.destroy();
    }
    resetBuildStatusTimeout() {
        if (this.buildStatusTimeout) {
            window.clearTimeout(this.buildStatusTimeout);
            this.buildStatusTimeout = undefined;
        }
        if (this.props.buildStatus && this.props.buildStatus.success) {
            const timeout = atom.config.get("atom-typescript.buildStatusTimeout");
            if (timeout > 0) {
                this.buildStatusTimeout = window.setTimeout(() => {
                    this.update({ buildStatus: undefined });
                }, timeout * 1000);
            }
            else if (timeout === 0) {
                this.update({ buildStatus: undefined });
            }
        }
    }
    openConfigPath() {
        if (this.props.tsConfigPath && !this.props.tsConfigPath.startsWith("/dev/null")) {
            utils_1.openFile(this.props.tsConfigPath);
        }
        else {
            atom.notifications.addInfo("No tsconfig for current file");
        }
    }
    showPendingRequests() {
        if (this.props.pending) {
            atom.notifications.addInfo("Pending Requests: <br/> - " + this.props.pending.join("<br/> - "));
        }
    }
    show() {
        this.update({ visible: true });
    }
    hide() {
        this.update({ visible: false });
    }
    renderVersion() {
        if (this.props.version) {
            return (etch.dom("div", { ref: "version", className: "inline-block" }, this.props.version));
        }
        return null;
    }
    renderPending() {
        if (this.props.pending && this.props.pending.length) {
            return (etch.dom("a", { ref: "pendingContainer", className: "inline-block", href: "", on: {
                    click: evt => {
                        evt.preventDefault();
                        this.showPendingRequests();
                    },
                } },
                etch.dom("span", { ref: "pendingCounter" }, this.props.pending.length.toString()),
                etch.dom("span", { ref: "pendingSpinner", className: "loading loading-spinner-tiny inline-block", style: { marginLeft: "5px", opacity: "0.5", verticalAlign: "sub" } })));
        }
        return null;
    }
    renderConfigPath() {
        if (this.props.tsConfigPath) {
            return (etch.dom("a", { ref: "configPathContainer", className: "inline-block", href: "", on: {
                    click: evt => {
                        evt.preventDefault();
                        this.openConfigPath();
                    },
                } }, this.props.tsConfigPath.startsWith("/dev/null")
                ? "No project"
                : path_1.dirname(utils_1.getFilePathRelativeToAtomProject(this.props.tsConfigPath))));
        }
        return null;
    }
    renderStatus() {
        if (this.props.buildStatus) {
            let cls;
            let text;
            if (this.props.buildStatus.success) {
                cls = "highlight-success";
                text = "Emit Success";
            }
            else {
                cls = "highlight-error";
                text = "Emit Failed";
            }
            return (etch.dom("div", { ref: "statusContainer", className: "inline-block" },
                etch.dom("span", { ref: "statusText", class: cls, on: { click: this.buildStatusClicked } }, text)));
        }
        return null;
    }
    renderProgress() {
        if (this.props.progress) {
            return (etch.dom("progress", { ref: "progress", style: { verticalAlign: "baseline" }, className: "inline-block", max: this.props.progress.max, value: this.props.progress.value }));
        }
        return null;
    }
}
exports.StatusPanel = StatusPanel;
//# sourceMappingURL=statusPanel.js.map