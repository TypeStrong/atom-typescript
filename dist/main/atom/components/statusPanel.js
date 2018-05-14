"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
const path_1 = require("path");
const atom_1 = require("atom");
class StatusPanel {
    constructor(props) {
        this.disposables = new atom_1.CompositeDisposable();
        this.buildStatusClicked = () => {
            if (this.props.buildStatus && !this.props.buildStatus.success) {
                atom.notifications.addError("Build failed", {
                    detail: this.props.buildStatus.message,
                    dismissable: true,
                });
            }
        };
        this.handlePendingRequests = () => {
            this.update({
                pending: [].concat(...Array.from(this.props.clientResolver.clients.values()).map(el => el.pending)),
            });
        };
        this.props = Object.assign({ visible: true }, props);
        etch.initialize(this);
        this.resetBuildStatusTimeout();
        this.disposables.add(this.props.clientResolver.on("pendingRequestsChange", this.handlePendingRequests));
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
        this.disposables.dispose();
    }
    dispose() {
        this.destroy();
    }
    show() {
        this.update({ visible: true });
    }
    hide() {
        this.update({ visible: false });
    }
    resetBuildStatusTimeout() {
        if (this.buildStatusTimeout !== undefined) {
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
        if (this.props.tsConfigPath !== undefined && !this.props.tsConfigPath.startsWith("/dev/null")) {
            atom.workspace.open(this.props.tsConfigPath);
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
    renderVersion() {
        if (this.props.version !== undefined) {
            return (etch.dom("div", { ref: "version", className: "inline-block" }, this.props.version));
        }
        return null;
    }
    renderPending() {
        if (this.props.pending && this.props.pending.length > 0) {
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
        if (this.props.tsConfigPath !== undefined) {
            return (etch.dom("a", { ref: "configPathContainer", className: "inline-block", href: "", on: {
                    click: evt => {
                        evt.preventDefault();
                        this.openConfigPath();
                    },
                } }, this.props.tsConfigPath.startsWith("/dev/null")
                ? "No project"
                : path_1.dirname(getFilePathRelativeToAtomProject(this.props.tsConfigPath))));
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
/**
 * converts "c:\dev\somethin\bar.ts" to "~something\bar".
 */
function getFilePathRelativeToAtomProject(filePath) {
    return "~" + atom.project.relativize(filePath);
}
//# sourceMappingURL=statusPanel.js.map