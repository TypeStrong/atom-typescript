"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atomUtils = require("../utils");
const atomts_1 = require("../../atomts");
const etch = require("etch");
const lodash_1 = require("lodash");
class SemanticViewComponent {
    constructor(props) {
        this.props = props;
        // /**
        //  * Actually component will never unmount ... so no unsubs for now
        //  */
        // componentWillUnmount() {} // see destroy()
        this.whileRendering = {
            lastCursorLine: 0,
        };
        this.subscribeToEditor = (editor) => {
            if (!editor || !atomUtils.onDiskAndTs(editor)) {
                // unsubscribe from editor
                // dispose subscriptions (except for editor-changing)
                if (this.editorScrolling) {
                    this.editorScrolling.dispose();
                }
                if (this.editorChanging) {
                    this.editorChanging.dispose();
                }
                this.update({ navTree: null });
                return;
            }
            this.setEditor(editor);
            // set navTree
            const filePath = editor.getPath();
            this.loadNavTree(filePath);
            // Subscribe to stop scrolling
            if (this.editorScrolling) {
                this.editorScrolling.dispose();
            }
            this.editorScrolling = editor.onDidChangeCursorPosition(() => {
                this.selectAtCursorLine();
            });
            if (this.editorChanging) {
                this.editorChanging.dispose();
            }
            this.editorChanging = editor.onDidStopChanging(() => {
                // set navTree
                const fPath = editor.getPath();
                this.loadNavTree(fPath);
            });
        };
        this.selectedNode = null;
        this.prepareNavTree(props.navTree);
        etch.initialize(this);
        atom.workspace.observeActiveTextEditor(this.subscribeToEditor);
    }
    async update(props) {
        if (props.navTree) {
            this.prepareNavTree(props.navTree);
        }
        this.props = Object.assign({}, this.props, props);
        await etch.update(this);
    }
    async destroy() {
        if (this.editorScrolling) {
            this.editorScrolling.dispose();
        }
        if (this.editorChanging) {
            this.editorChanging.dispose();
        }
        if (this.activeEditorChanging) {
            this.activeEditorChanging.dispose();
        }
        this.selectedNode = null;
        await etch.destroy(this);
    }
    setEditor(editor) {
        this.editor = editor;
    }
    async setNavTree(navTree) {
        this.prepareNavTree(navTree);
        if (lodash_1.isEqual(navTree, this.props.navTree)) {
            return;
        }
        this.props = { navTree };
        await etch.update(this);
    }
    async forceUpdate() {
        await etch.update(this);
    }
    async loadNavTree(filePath) {
        filePath = filePath ? filePath : this.editor.getPath();
        // const client = await clientResolver.get(filePath);
        if (filePath) {
            try {
                const client = await atomts_1.clientResolver.get(filePath);
                await client.executeOpen({ file: filePath });
                const navtreeResult = await client.executeNavTree({ file: filePath });
                const navTree = navtreeResult ? navtreeResult.body : undefined;
                if (navTree) {
                    this.setNavTree(navTree);
                }
            }
            catch (err) {
                console.error(err, filePath);
            }
        }
    }
    /**
     * HELPER modify / prepare NavigationTree for rendering.
     *
     * E.g. sort childItems by their location, preprocess className-string
     *
     * @param {NavigationTreeExt} navTree
     *            the NavigationTree that will be prepared for rendering
     */
    prepareNavTree(navTree) {
        if (navTree === null)
            return;
        navTree.styleClasses = this.getIconForKind(navTree.kind);
        const modifiersClasses = this.getClassForKindModifiers(navTree.kindModifiers);
        if (modifiersClasses) {
            navTree.styleClasses += " " + modifiersClasses;
        }
        if (navTree.childItems) {
            if (navTree.childItems.length < 1) {
                // normalize: remove empty lists
                navTree.childItems = undefined;
                return;
            }
            // TODO should there be a different sort-order?
            //     for now: sort ascending by line-number
            navTree.childItems.sort((a, b) => this.getNodeStartLine(a) - this.getNodeStartLine(b));
            let child;
            for (child of navTree.childItems) {
                this.prepareNavTree(child);
            }
        }
    }
    render() {
        // node?: HTMLElement): void {
        // this.root = node ? node : this.root
        // if (!this.root) {
        //   console.error("cannot render: not initialized yet.")
        //   return ////////////// EARLY EXIT /////////////////
        // }
        this.whileRendering = {
            lastCursorLine: this.editor && this.editor.getLastCursor()
                ? this.editor.getLastCursor().getBufferRow()
                : null,
        };
        this.selectedNode = null;
        // if (!this.props.navTree) {
        //   if (this.props.navTree === null) {
        //     let child = this.refs.main.firstChild
        //     if (child) this.refs.main.removeChild(child)
        //   }
        //   return ////////////// EARLY EXIT /////////////////
        // }
        // let content = (
        //   <ol className="list-tree has-collapsable-children focusable-panel">
        //     {this.renderNode(this.props.navTree, 0)}
        //   </ol>
        // )
        // let child = this.root.firstChild
        // if (child) this.root.replaceChild(content, child)
        // else this.root.appendChild(content)
        //
        // if (this.selectedNode) this.scrollTo(this.selectedNode)
        return (etch.dom("div", { class: "atomts atomts-semantic-view native-key-bindings" },
            etch.dom("ol", { ref: "main", className: "list-tree has-collapsable-children focusable-panel" }, this.renderNode(this.props.navTree))));
    }
    writeAfterUpdate() {
        // TODO should this use hook readAfterUpdate() instead?
        if (this.selectedNode)
            this.scrollTo(this.selectedNode);
    }
    getNodeStartLine(node) {
        // console.log('getNodeStartLine.node -> ', node)
        return node && node.spans ? node.spans[0].start.line - 1 : 0;
    }
    getNodeEndLine(node) {
        const s = node.spans;
        return s ? s[s.length - 1].end.line - 1 : 0;
    }
    getDomNodeStartLine(elem) {
        return parseInt(elem.dataset.start, 10);
    }
    getDomNodeEndLine(elem) {
        return parseInt(elem.dataset.end, 10);
    }
    renderNode(node) {
        // const selected = this.isSelected(node) TODO find way to set initial selection
        if (node === null)
            return null;
        const domNode = (etch.dom("li", { className: "node entry exanded list-" + (node.childItems ? "nested-" : "") + "item", dataset: {
                start: this.getNodeStartLine(node),
                end: this.getNodeEndLine(node),
            } },
            etch.dom("div", { className: "header list-item", on: { click: event => this.entryClicked(event, node) } },
                etch.dom("span", { className: node.styleClasses }, node.text || "")),
            etch.dom("ol", { className: "entries list-tree" }, node.childItems ? node.childItems.map(sn => this.renderNode(sn)) : "")));
        // set selected
        // this.setSelected(domNode, selected) TODO find way to set initial selection
        return domNode;
    }
    entryClicked(event, node) {
        const target = event.target.closest(".node");
        const isToggle = this.isToggleEntry(target, event);
        // console.log(isToggle ? "click-toggle" : "click-scroll")
        if (!isToggle) {
            this.gotoNode(node);
        }
        else if (target) {
            const isCollapsed = target.classList.contains("collapsed");
            if (isCollapsed) {
                this.expandEntry(target);
            }
            else {
                this.collapseEntry(target);
            }
        }
        event.stopPropagation();
    }
    collapseEntry(target) {
        target.classList.add("collapsed");
        target.classList.remove("expanded");
    }
    expandEntry(target) {
        target.classList.add("expanded");
        target.classList.remove("collapsed");
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
    /**
     * HELPER test if <code>childNode</code> is a child of <code>node</code>
     * @param  {HTMLElement} childNode
     *            the node to be tested
     * @param  {HTMLElement} node
     *            the (potential) parent node
     * @return {Boolean} true, if node is a parent of childNode
     */
    isChild(childNode, node) {
        let parent = childNode.parentNode;
        while (parent !== node && parent !== null) {
            parent = parent.parentNode;
        }
        return parent === node;
    }
    /**
     * HELPER test, if the HTMLElement for <code>node</code> should be selected,
     *        by checking if the current cursor is within start-, end-line of the
     *        node.
     *
     * NOTE since the node may conatain other nodes, that also "should be selected",
     *      a separate mechanism needs to take care, that only the node, that is
     *      "furthest down" in the hiearchy gets selected.
     *
     * @param  {NavigationTree} node
     *            the node to be tested
     * @return {Boolean} true, if the node's HTML representation should be selected
     */
    isSelected(node) {
        if (this.whileRendering.lastCursorLine == null)
            return false;
        else {
            if (this.getNodeStartLine(node) <= this.whileRendering.lastCursorLine &&
                this.getNodeEndLine(node) >= this.whileRendering.lastCursorLine) {
                return true;
            }
            return false;
        }
    }
    /**
     * HELPER mark a node's HTML representation as selected
     * @param {HTMLElement} domNode
     *          a node's HTML represenation
     * @param {Boolean} selected
     *          the selection is only set, if selected is true
     *          (i.e. if false, this invocation does nothing)
     * @param {Boolean} [forceSelection] OPTIONAL
     *                                   if true, set domNode as selected, even if
     *                                   node is a parent-node of a node that is already
     *                                   selected (i.e. there is a selected node "furhter down")
     */
    setSelected(domNode, selected, forceSelection) {
        if (selected) {
            let setSelected = true;
            if (this.selectedNode) {
                // do not select, if there is a node selected "further down"
                if (!forceSelection && this.isChild(this.selectedNode, domNode)) {
                    setSelected = false;
                }
            }
            if (setSelected) {
                if (this.selectedNode === domNode) {
                    return;
                }
                if (this.selectedNode) {
                    this.selectedNode.classList.remove("selected");
                }
                domNode.classList.add("selected");
                this.selectedNode = domNode;
            }
        }
    }
    /**
     * HELPER select the node's HTML represenation which corresponds to the
     *        current cursor position
     */
    selectAtCursorLine() {
        this.whileRendering = {
            lastCursorLine: this.editor && this.editor.getLastCursor()
                ? this.editor.getLastCursor().getBufferRow()
                : null,
        };
        const cursorLine = this.whileRendering.lastCursorLine;
        if (!cursorLine || !this.props.navTree || !this.refs.main) {
            return;
        }
        const selectedChild = this.findNodeAtCursorLine(this.refs.main, cursorLine);
        if (selectedChild !== null) {
            // console.log('select at cursor-line '+cursorLine, selectedChild);
            this.setSelected(selectedChild, true, true);
            this.scrollTo(selectedChild);
        }
    }
    /**
     * HELPER find the node (its HTML representation) the is "furthest down" the
     *        node hiearchy, i.e. which's start-, end-position contains the
     *        cursorLine AND is smallest.
     * @param  {HTMLElement} domNode
     *                  the HTML element from which to start searching
     * @param  {Number} cursorLine the cursor line
     * @return {HTMLElement|null} the node's HTML representation which matches cursorLine
     *                            (i.e. which' start-, end-position contain cursorLine while
     *                             having the smallest distance to cursorLine), or NULL if no
     *                            matching HTML representation can be found within domNode
     */
    findNodeAtCursorLine(domNode, cursorLine) {
        if (!domNode.children) {
            return null;
        }
        for (const elem of Array.from(domNode.children)) {
            if (elem.dataset) {
                const start = this.getDomNodeStartLine(elem);
                const end = this.getDomNodeEndLine(elem);
                if (isFinite(start) && isFinite(end)) {
                    if (cursorLine >= start && cursorLine <= end) {
                        const selected = this.findNodeAtCursorLine(elem, cursorLine);
                        if (selected) {
                            return selected;
                        }
                    }
                    else if (isFinite(end) && cursorLine < end) {
                        break;
                    }
                }
            }
            const selectedChild = this.findNodeAtCursorLine(elem, cursorLine);
            if (selectedChild) {
                return selectedChild;
            }
        }
        if (domNode.dataset) {
            const start = this.getDomNodeStartLine(domNode);
            const end = this.getDomNodeEndLine(domNode);
            if (isFinite(start) && isFinite(end) && cursorLine >= start && cursorLine <= end) {
                return domNode;
            }
        }
        return null;
    }
    /**
     * HELPER scroll the node's HTML representation (i.e. domNode) into view
     *        (i.e. scroll the semantic-view's tree representation)
     * @param  {HTMLElement} domNode the HTMLElement that should be made visisble
     */
    scrollTo(domNode) {
        const elem = domNode;
        if (typeof elem.scrollIntoViewIfNeeded === "function") {
            elem.scrollIntoViewIfNeeded();
        }
        else if (typeof elem.scrollIntoView === "function") {
            elem.scrollIntoView();
        } // TODO else: impl. scroll
    }
    /**
     * HELPER scroll the current editor so that the node's representation becomes
     *        visible
     *        (i.e. scroll the text/typescript editor)
     * @param  {NavigationTree} node
     *              the node which's element should be made visible in the editor
     */
    gotoNode(node) {
        const gotoLine = this.getNodeStartLine(node);
        this.editor.setCursorBufferPosition([gotoLine, 0]);
    }
}
exports.SemanticViewComponent = SemanticViewComponent;
//# sourceMappingURL=semanticViewComponent.js.map