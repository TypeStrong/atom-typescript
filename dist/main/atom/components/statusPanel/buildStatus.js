"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const etch = require("etch");
const lodash_1 = require("lodash");
const utils_1 = require("../../../../utils");
const tooltip_1 = require("./tooltip");
class BuildStatus {
    constructor(props) {
        this.hiddenBuildStatus = false;
        this.disposables = new atom_1.CompositeDisposable();
        this.buildStatusClicked = () => {
            if (!this.props.buildStatus.success) {
                atom.notifications.addError("Build failed", {
                    detail: this.props.buildStatus.message,
                    dismissable: true,
                });
            }
        };
        this.props = Object.assign({}, props);
        this.setHideBuildStatus(atom.config.get("atom-typescript").buildStatusTimeout);
        this.resetBuildStatusTimeout();
        etch.initialize(this);
        this.disposables.add(atom.config.onDidChange("atom-typescript.buildStatusTimeout", ({ newValue }) => {
            this.setHideBuildStatus(newValue);
            utils_1.handlePromise(this.update({}));
        }));
    }
    async update(props) {
        const successStateChanged = props.buildStatus !== undefined &&
            props.buildStatus.success !== this.props.buildStatus.success;
        this.props = Object.assign(Object.assign({}, this.props), props);
        if (successStateChanged)
            this.resetBuildStatusTimeout();
        await etch.update(this);
    }
    render() {
        if (this.hiddenBuildStatus)
            return etch.dom("span", null);
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
        return (etch.dom(tooltip_1.Tooltip, { title: this.props.buildStatus.success
                ? "Build was successful"
                : "Build failed; click to show error message" },
            etch.dom("span", { className: cls, on: { click: this.buildStatusClicked } }, text)));
    }
    async destroy() {
        await etch.destroy(this);
    }
    resetBuildStatusTimeout() {
        this.hiddenBuildStatus = false;
        if (this.props.buildStatus.success) {
            this.hideBuildStatus();
        }
    }
    setHideBuildStatus(value) {
        if (value > 0) {
            this.hideBuildStatus = lodash_1.debounce(() => {
                this.hiddenBuildStatus = true;
                utils_1.handlePromise(etch.update(this));
            }, value * 1000);
        }
        else if (value === 0) {
            this.hideBuildStatus = () => {
                this.hiddenBuildStatus = true;
            };
        }
        else
            this.hideBuildStatus = () => { };
    }
}
exports.BuildStatus = BuildStatus;
//# sourceMappingURL=buildStatus.js.map