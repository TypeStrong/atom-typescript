"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
const lodash_1 = require("lodash");
const navTreeUtils_1 = require("./navTreeUtils");
class NavigationNodeComponent {
    constructor(props) {
        this.props = props;
        this.updateStyles(props.navTree);
        etch.initialize(this);
    }
    updateStyles(navTree) {
        if (navTree) {
            navTree.styleClasses = this.getIconForKind(navTree.kind);
            const modifiersClasses = this.getClassForKindModifiers(navTree.kindModifiers);
            if (modifiersClasses) {
                navTree.styleClasses += " " + modifiersClasses;
            }
        }
    }
    getIconForKind(kind) {
        return `icon icon-${kind}`;
    }
    getClassForKindModifiers(kindModifiers) {
        if (!kindModifiers) {
            return "";
        }
        else if (kindModifiers.indexOf(" ") === -1 && kindModifiers.indexOf(",") === -1) {
            return `modifier-${kindModifiers}`;
        }
        else {
            return kindModifiers
                .split(/[, ]/)
                .map(modifier => "modifier-" + modifier.trim())
                .join(" ");
        }
    }
    async update(props) {
        this.props = Object.assign({}, this.props, props);
        if (props.navTree) {
            this.updateStyles(props.navTree);
        }
        await etch.update(this);
    }
    async destroy() {
        this.props.root = undefined;
        await etch.destroy(this);
    }
    render() {
        return this.renderNode(this.props.navTree);
    }
    renderNode(node) {
        if (node === null)
            return etch.dom("div", null);
        const _pos = this.props.pos;
        if (!_pos)
            return etch.dom("div", null);
        const selected = (_pos.selectedNode && this.isSameNode(node, _pos.selectedNode)) ||
            (!_pos.selectedNode && navTreeUtils_1.isSelected(node, _pos));
        if (selected) {
            // console.log("selecting node ", node) // DEBUG
            _pos.selectedNode = node;
        }
        const classes = (node.childItems ? "nested-" : "") +
            "item" +
            (node.collapsed ? " collapsed" : " expanded") +
            (selected ? " selected" : "");
        return (etch.dom("li", { className: "node entry exanded list-" + classes },
            etch.dom("div", { className: "header list-item", on: { click: event => this.entryClicked(event, node) } },
                etch.dom("span", { className: node.styleClasses }, node.text || "")),
            etch.dom("ol", { className: "entries list-tree" }, node.childItems
                ? node.childItems.map(sn => (etch.dom(NavigationNodeComponent, { navTree: sn, root: this.props.root, pos: _pos })))
                : null)));
    }
    isSameNode(n1, n2) {
        return n1.text === n2.text && lodash_1.isEqual(n1.spans, n2.spans);
    }
    entryClicked(event, node) {
        event.stopPropagation();
        const isToggle = this.isToggleEntry(node, event);
        if (!isToggle && this.props.root) {
            this.props.root.gotoNode(node);
        }
        else {
            this.toggleNode(node);
            etch.update(this);
        }
    }
    toggleNode(node) {
        node.collapsed = !node.collapsed;
    }
    /**
     * HACK workaround for detecting click on collapse-/expand-icon
     *      (cannot directly register/detect click on icons, since inserted via ::before style)
     *
     * @param {NavigationTreeViewModel} node
     *                        the corresponding NavTree node
     * @param {MouseEvent} event
     *                        the mouse event
     * @returns {Boolean} <code>true</code> if entry's expand/collapse state should be toggled for nodeEntry
     *                                      (instead of navigating to its position in the text editor)
     */
    isToggleEntry(node, event) {
        return !!node.childItems && event.target === event.currentTarget;
    }
}
exports.NavigationNodeComponent = NavigationNodeComponent;
//# sourceMappingURL=navigationNodeComponent.js.map