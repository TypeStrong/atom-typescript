"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const etch = require("etch");
const path_1 = require("path");
const utils_1 = require("../utils");
class StatusPanel {
    constructor(props = {}) {
        this.props = {
            version: props.version,
            pending: props.pending,
            tsConfigPath: props.tsConfigPath,
            buildStatus: props.buildStatus,
            progress: props.progress,
            visible: true,
        };
        etch.initialize(this);
    }
    update(props) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const k of Object.keys(this.props)) {
                if (props[k] !== undefined && props[k] !== this.props[k]) {
                    this.props[k] = props[k];
                }
            }
            yield etch.update(this);
        });
    }
    render() {
        return (etch.dom("ts-status-panel", { className: this.props.visible ? "" : "hide" },
            this.renderVersion(),
            this.renderPending(),
            this.renderConfigPath(),
            this.renderStatus(),
            this.renderProgress()));
    }
    destroy() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield etch.destroy(this);
        });
    }
    dispose() {
        this.destroy();
    }
    openConfigPath() {
        if (this.configPath && !this.configPath.startsWith("/dev/null")) {
            utils_1.openFile(this.configPath);
        }
        else {
            atom.notifications.addInfo("No tsconfig for current file");
        }
    }
    showPendingRequests() {
        if (this.pendingRequests) {
            atom.notifications.addInfo("Pending Requests: <br/> - " + this.pendingRequests.join("<br/> - "));
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
                etch.dom("span", { ref: "statusText", class: cls }, text)));
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