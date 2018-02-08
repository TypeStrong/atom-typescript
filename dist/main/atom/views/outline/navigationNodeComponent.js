"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
const lodash_1 = require("lodash");
class NavigationNodeComponent {
    constructor(props) {
        this.props = props;
        // this.init(props.navTree);
        etch.initialize(this);
    }
    // private init(navTree: NavigationTreeViewModel|null){
    //   if(navTree){
    //     navTree.styleClasses = this.getIconForKind(navTree.kind)
    //     const modifiersClasses = this.getClassForKindModifiers(navTree.kindModifiers)
    //     if (modifiersClasses) {
    //       navTree.styleClasses += " " + modifiersClasses
    //     }
    //   }
    // }
    // private getIconForKind(kind: string): string {
    //   return `icon icon-${kind}`
    // }
    //
    // private getClassForKindModifiers(kindModifiers: string): string {
    //   if (!kindModifiers) {
    //     return ""
    //   } else if (kindModifiers.indexOf(" ") === -1 && kindModifiers.indexOf(",") === -1) {
    //     return `modifier-${kindModifiers}`
    //   } else {
    //     return kindModifiers
    //       .split(/[, ]/)
    //       .map(modifier => "modifier-" + modifier.trim())
    //       .join(" ")
    //   }
    // }
    async update(props) {
        this.props = Object.assign({}, this.props, props);
        await etch.update(this);
    }
    async destroy() {
        this.props.root = null;
        await etch.destroy(this);
    }
    render() {
        return this.renderNode(this.props.navTree);
    }
    renderNode(node) {
        if (node === null)
            return etch.dom("div", null);
        const _root = this.props.root;
        if (!_root)
            return etch.dom("div", null);
        const selected = (_root.selectedNode && this.isSameNode(node, _root.selectedNode)) ||
            (!_root.selectedNode && _root.isSelected(node));
        if (selected) {
            // console.log("selecting node ", node) // DEBUG
            _root.selectedNode = node;
        }
        const classes = (node.childItems ? "nested-" : "") +
            "item" +
            (node.collapsed ? " collapsed" : " expanded") +
            (selected ? " selected" : "");
        return (etch.dom("li", { className: "node entry exanded list-" + classes },
            etch.dom("div", { className: "header list-item", on: { click: event => this.entryClicked(event, node) } },
                etch.dom("span", { className: node.styleClasses }, node.text || "")),
            etch.dom("ol", { className: "entries list-tree" }, node.childItems
                ? node.childItems.map(sn => etch.dom(NavigationNodeComponent, { navTree: sn, root: _root }))
                : null)));
    }
    isSameNode(n1, n2) {
        return n1.text === n2.text && lodash_1.isEqual(n1.spans, n2.spans);
    }
    entryClicked(event, node) {
        event.stopPropagation();
        const target = event.target.closest(".node");
        const isToggle = this.isToggleEntry(target, event);
        if (!isToggle && this.props.root) {
            this.props.root.gotoNode(node);
        }
        else if (target) {
            this.toggleNode(node);
            etch.update(this);
        }
    }
    toggleNode(node) {
        // console.log("toggle " + !!node.collapsed + " -> " + !node.collapsed + " ", node) // DEBUG
        node.collapsed = !node.collapsed;
    }
    /**
     * HACK detect click on collapse-/expand-icon
     *      (cannot directly register/detect click on icons, since inserted via ::before style)
     *
     * @param {ElementExt} nodeEntry
     *                        the HTML element representing the NavigationTree node
     * @param {MouseEvent} event
     *                        the mouse event
     * @returns {Boolean} <code>true</code> if entry's expand/collapse state should be toggled
     *                                      (instead of navigating to its position in the text editor)
     */
    isToggleEntry(nodeEntry, event) {
        if (!nodeEntry || !event.target) {
            return false;
        }
        let isToggle = nodeEntry.classList.contains("list-nested-item");
        // only continue, if entry as sub-entries (i.e. is nested list item):
        if (isToggle) {
            const target = event.target;
            // only toggle, if label-wrapper, i.e. element <span class="header list-item"> was clicked
            //  (since the "label-wrapper" has the expand/collapse icon attached via its ::before style)
            if (!target.classList.contains("header") || !target.classList.contains("list-item")) {
                isToggle = false;
            }
        }
        return isToggle;
    }
}
exports.NavigationNodeComponent = NavigationNodeComponent;
//# sourceMappingURL=navigationNodeComponent.js.map