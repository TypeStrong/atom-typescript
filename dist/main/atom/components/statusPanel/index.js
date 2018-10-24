"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
const utils_1 = require("../../../../utils");
const configPath_1 = require("./configPath");
const buildStatus_1 = require("./buildStatus");
const tooltip_1 = require("./tooltip");
class StatusPanel {
    constructor(props = {}) {
        this.props = Object.assign({ visible: true }, props);
        etch.initialize(this);
    }
    async update(props) {
        this.props = Object.assign({}, this.props, props);
        await etch.update(this);
    }
    render() {
        return (etch.dom("ts-status-panel", { className: this.props.visible ? "" : "hide" },
            this.renderVersion(),
            this.renderPending(),
            this.renderConfigPath(),
            this.renderProgress() || this.renderStatus()));
    }
    async destroy() {
        await etch.destroy(this);
    }
    dispose() {
        utils_1.handlePromise(this.destroy());
    }
    async show() {
        await this.update({ visible: true });
    }
    async hide() {
        await this.update({ visible: false });
    }
    renderVersion() {
        if (this.props.version !== undefined) {
            return etch.dom(tooltip_1.Tooltip, { title: "Active TypeScript version" }, this.props.version);
        }
        return null;
    }
    renderPending() {
        if (this.props.pending && this.props.pending.length > 0) {
            return (etch.dom(tooltip_1.Tooltip, { title: `Pending Requests: <ul>${this.props.pending
                    .map(x => `<li>${x}</li>`)
                    .join("")}</ul>`, html: true },
                etch.dom("span", { ref: "pendingCounter" }, this.props.pending.length.toString()),
                etch.dom("span", { ref: "pendingSpinner", className: "loading loading-spinner-tiny inline-block", style: { marginLeft: "5px", opacity: "0.5", verticalAlign: "sub" } })));
        }
        else
            return null;
    }
    renderConfigPath() {
        if (this.props.tsConfigPath !== undefined) {
            return etch.dom(configPath_1.ConfigPath, { tsConfigPath: this.props.tsConfigPath });
        }
        return null;
    }
    renderStatus() {
        if (this.props.buildStatus) {
            return etch.dom(buildStatus_1.BuildStatus, { buildStatus: this.props.buildStatus });
        }
        return null;
    }
    renderProgress() {
        if (this.props.progress) {
            return (etch.dom("progress", { style: { verticalAlign: "baseline" }, className: "inline-block", max: this.props.progress.max, value: this.props.progress.value }));
        }
        return null;
    }
}
exports.StatusPanel = StatusPanel;
//# sourceMappingURL=index.js.map