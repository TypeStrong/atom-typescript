"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
const utils_1 = require("../../../../utils");
const buildStatus_1 = require("./buildStatus");
const configPath_1 = require("./configPath");
const tooltip_1 = require("./tooltip");
class StatusPanel {
    constructor(props = {}) {
        this.props = Object.assign({ visible: true, pending: [], progress: { max: 0, value: 0 } }, props);
        etch.initialize(this);
    }
    async update(props) {
        this.props = Object.assign(Object.assign({}, this.props), props);
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
        utils_1.handlePromise(this.destroy());
    }
    async show() {
        await this.update({ visible: true });
    }
    async hide() {
        await this.update({ visible: false });
    }
    renderVersion() {
        if (this.props.clientVersion !== undefined) {
            return etch.dom(tooltip_1.Tooltip, { title: "Active TypeScript version" }, this.props.clientVersion);
        }
        return null;
    }
    renderPending() {
        if (this.props.pending.length > 0) {
            return (etch.dom(tooltip_1.Tooltip, { title: `Pending Requests: <ul>${this.props.pending
                    .map(({ title }) => `<li>${title}</li>`)
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
        if (this.props.progress.value < this.props.progress.max) {
            return (etch.dom("progress", { style: { verticalAlign: "baseline" }, className: "inline-block", max: this.props.progress.max, value: this.props.progress.value }));
        }
        return null;
    }
}
exports.StatusPanel = StatusPanel;
//# sourceMappingURL=index.js.map