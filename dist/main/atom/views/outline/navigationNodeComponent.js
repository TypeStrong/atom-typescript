"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
const navTreeUtils_1 = require("./navTreeUtils");
class NavigationNodeComponent {
    constructor(props) {
        this.props = props;
        etch.initialize(this);
    }
    async update(props) {
        this.props = Object.assign({}, this.props, props);
        await etch.update(this);
    }
    async destroy() {
        await etch.destroy(this);
    }
    render() {
        const node = this.props.navTree;
        const { ctrl } = this.props;
        const selectedNode = ctrl.getSelectedNode();
        const selected = selectedNode && navTreeUtils_1.isSameNode(node, selectedNode);
        const classes = (node.childItems ? "nested-" : "") +
            "item" +
            (node.collapsed ? " collapsed" : " expanded") +
            (selected ? " selected" : "");
        const styleClasses = this.getStyles();
        return (etch.dom("li", { className: "node entry exanded list-" + classes },
            etch.dom("div", { className: "header list-item", on: { click: event => this.entryClicked(event, node) } },
                etch.dom("span", { className: styleClasses }, node.text)),
            etch.dom("ol", { className: "entries list-tree" }, node.childItems
                ? node.childItems.map(sn => etch.dom(NavigationNodeComponent, { navTree: sn, ctrl: ctrl }))
                : null)));
    }
    getStyles() {
        const { kind } = this.props.navTree;
        let styles = `icon icon-${kind}`;
        const { kindModifiers } = this.props.navTree;
        if (kindModifiers) {
            styles +=
                " " +
                    kindModifiers
                        .split(/[, ]/)
                        .map(modifier => `modifier-${modifier.trim()}`)
                        .join(" ");
        }
        return styles;
    }
    entryClicked(event, node) {
        event.stopPropagation();
        const isToggle = navTreeUtils_1.isToggleEntry(node, event);
        if (!isToggle) {
            this.props.ctrl.gotoNode(node);
        }
        else {
            node.collapsed = !node.collapsed;
            etch.update(this);
        }
    }
}
exports.NavigationNodeComponent = NavigationNodeComponent;
//# sourceMappingURL=navigationNodeComponent.js.map