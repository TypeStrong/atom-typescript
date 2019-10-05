"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
const path_1 = require("path");
const utils_1 = require("../../../../utils");
const tooltip_1 = require("./tooltip");
class ConfigPath {
    constructor(props) {
        this.props = Object.assign({}, props);
        etch.initialize(this);
    }
    async update(props) {
        this.props = Object.assign(Object.assign({}, this.props), props);
        await etch.update(this);
    }
    render() {
        return (etch.dom(tooltip_1.Tooltip, { title: () => this.props.tsConfigPath.startsWith("/dev/null")
                ? "No tsconfig.json"
                : `Click to open ${atom.project.relativize(this.props.tsConfigPath)}` },
            etch.dom("a", { className: "inline-block", href: "", on: {
                    click: evt => {
                        evt.preventDefault();
                        this.openConfigPath();
                    },
                } }, this.props.tsConfigPath.startsWith("/dev/null")
                ? "No project"
                : path_1.dirname(getFilePathRelativeToAtomProject(this.props.tsConfigPath)))));
    }
    async destroy() {
        await etch.destroy(this);
    }
    openConfigPath() {
        if (!this.props.tsConfigPath.startsWith("/dev/null")) {
            utils_1.handlePromise(atom.workspace.open(this.props.tsConfigPath));
        }
        else {
            atom.notifications.addInfo("No tsconfig for current file");
        }
    }
}
exports.ConfigPath = ConfigPath;
/**
 * converts "c:\dev\somethin\bar.ts" to "~something\bar".
 */
function getFilePathRelativeToAtomProject(filePath) {
    return "~" + atom.project.relativize(filePath);
}
//# sourceMappingURL=configPath.js.map