"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atomUtils = require("../../utils");
const atomts_1 = require("../../../atomts");
const etch = require("etch");
const lodash_1 = require("lodash");
const navigationNodeComponent_1 = require("./navigationNodeComponent");
class NavigationTreeComponent {
    constructor(props) {
        this.props = props;
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
            this.loadNavTree();
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
                this.loadNavTree();
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
        this.restoreCollapsed(navTree, this.props.navTree);
        this.props.navTree = navTree;
        this.selectedNode = null;
        await etch.update(this);
    }
    async loadNavTree() {
        const filePath = this.editor.getPath();
        if (filePath) {
            try {
                const client = await atomts_1.clientResolver.get(filePath);
                await client.executeOpen({ file: filePath });
                const navtreeResult = await client.executeNavTree({ file: filePath });
                const navTree = navtreeResult.body;
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
     * @param {NavigationTreeViewModel} navTree
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
            for (const child of navTree.childItems) {
                this.prepareNavTree(child);
            }
        }
    }
    /**
     * HELPER transfere collapsed state from old NavigationTreeViewModel to
     * new view model.
     *
     * @returns {boolean} TRUE, if newTree and oldTree matched title
     */
    restoreCollapsed(newTree, oldTree) {
        if (!newTree || !oldTree)
            return newTree === oldTree;
        // a bit of guess work here:
        // there may have been additions/deletions in the children
        // (in comparision to the previous navTree), so the tranfere of
        // the collapsed state really is a heuristical process.
        //
        // For now, we assume, if the name (i.e. node.text) is the same
        // then it refers to the same entity (i.e. it should get the same
        // collapsed state); which is not true in case a variable/function/etc
        // was renamed.
        // But we do not want the get too elaborate and do expensive modification-
        // detection here, so in case of renaming, we just reset the collapsed
        // state to the default (i.e. expanded).
        // Same for reordering etc. of children: for complex changes we just
        // revert to the default state.
        if (newTree.text === oldTree.text) {
            if (oldTree.collapsed) {
                newTree.collapsed = true;
            }
            if (newTree.childItems && oldTree.childItems) {
                let newChild;
                let oldChild;
                for (let i = 0, size = newTree.childItems.length; i < size; ++i) {
                    newChild = newTree.childItems[i];
                    oldChild = oldTree.childItems[i];
                    // allow for one addition / deletion in the children
                    // (i.e. check if there's a match in the previous/next position)
                    if (!this.restoreCollapsed(newChild, oldChild)) {
                        // try, if a child was removed
                        oldChild = oldTree.childItems[i + 1];
                        if (!this.restoreCollapsed(newChild, oldChild)) {
                            // try, if a child was added
                            oldChild = oldTree.childItems[i - 1];
                            this.restoreCollapsed(newChild, oldChild);
                        }
                    }
                }
            }
            return true;
        }
        return false;
    }
    render() {
        this.whileRendering = {
            lastCursorLine: this.editor && this.editor.getLastCursor()
                ? this.editor.getLastCursor().getBufferRow()
                : null,
        };
        return (etch.dom("div", { class: "atomts atomts-semantic-view native-key-bindings" },
            etch.dom("ol", { ref: "main", className: "list-tree has-collapsable-children focusable-panel" },
                etch.dom(navigationNodeComponent_1.NavigationNodeComponent, { navTree: this.props.navTree, root: this }))));
    }
    readAfterUpdate() {
        // scroll to selected node:
        const selectedElement = this.refs.main.getElementsByClassName("selected")[0];
        if (selectedElement)
            this.scrollTo(selectedElement);
    }
    getNodeStartLine(node) {
        // console.log('getNodeStartLine.node -> ', node)
        return node && node.spans ? node.spans[0].start.line - 1 : 0;
    }
    getNodeStartOffset(node) {
        // console.log('getNodeStartLine.node -> ', node)
        return node && node.spans ? node.spans[0].start.offset - 1 : 0;
    }
    getNodeEndLine(node) {
        const s = node.spans;
        return s ? s[s.length - 1].end.line - 1 : 0;
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
     * HELPER test, if the HTMLElement for <code>node</code> should be selected,
     *        by checking if the current cursor is within start-, end-line of the
     *        node.
     *
     * NOTE since the node may conatain other nodes, that also "should be selected",
     *      a separate mechanism needs to take care, that only the node, that is
     *      "furthest down" in the hiearchy gets selected.
     *
     * @param  {NavigationTreeViewModel} node
     *            the node to be tested
     * @return {Boolean} true, if the node's HTML representation should be selected
     */
    isSelected(node) {
        if (this.whileRendering.lastCursorLine == null)
            return false;
        else {
            if (this.getNodeStartLine(node) <= this.whileRendering.lastCursorLine &&
                this.getNodeEndLine(node) >= this.whileRendering.lastCursorLine) {
                const start = this.getNodeStartLine(node);
                const end = this.getNodeEndLine(node);
                if (this.findNodeAt(start, end, node)) {
                    // -> there is a node "further down" that should get selected
                    return false;
                }
                return true;
            }
            return false;
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
        const selectedChild = this.findNodeAt(cursorLine, cursorLine, this.props.navTree);
        if (selectedChild !== null) {
            // console.log("select at cursor-line " + cursorLine, selectedChild) // DEBUG
            this.selectedNode = selectedChild;
            etch.update(this);
        }
    }
    /**
     * HELPER find the node that is "furthest down" the
     *        node hiearchy, i.e. which's start-, end-position contains the
     *        cursorLine AND is smallest.
     * @param  {NavigationTreeViewModel} node
     *                  the HTML element from which to start searching
     * @param  {Number} cursorLine the cursor line
     * @return {HTMLElement|null} the node's HTML representation which matches cursorLine
     *                            (i.e. which' start-, end-position contain cursorLine while
     *                             having the smallest distance to cursorLine), or NULL if no
     *                            matching node can be found
     */
    findNodeAt(startLine, endLine, node) {
        if (!node.childItems) {
            return null;
        }
        for (const elem of node.childItems) {
            const start = this.getNodeStartLine(elem);
            const end = this.getNodeEndLine(elem);
            if (isFinite(start) && isFinite(end)) {
                if (startLine >= start && endLine <= end) {
                    const selected = this.findNodeAt(startLine, endLine, elem);
                    if (selected) {
                        return selected;
                    }
                    else {
                        return elem;
                    }
                }
                else if (isFinite(end) && endLine < end) {
                    break;
                }
            }
            const selectedChild = this.findNodeAt(startLine, endLine, elem);
            if (selectedChild) {
                return selectedChild;
            }
        }
        const nstart = this.getNodeStartLine(node);
        const nend = this.getNodeEndLine(node);
        if (isFinite(nstart) && isFinite(nend) && startLine >= nstart && endLine <= nend) {
            return node;
        }
        return null;
    }
    /**
     * HELPER scroll the node's HTML representation (i.e. domNode) into view
     *        (i.e. scroll the semantic-view's tree representation)
     * @param  {Element} domNode the HTMLElement that should be made visisble
     */
    scrollTo(domNode) {
        const elem = domNode;
        if (typeof elem.scrollIntoViewIfNeeded === "function") {
            elem.scrollIntoViewIfNeeded();
        }
        else {
            elem.scrollIntoView();
        }
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
        const gotoOffset = this.getNodeStartOffset(node);
        this.editor.setCursorBufferPosition([gotoLine, gotoOffset]);
    }
}
exports.NavigationTreeComponent = NavigationTreeComponent;
//# sourceMappingURL=navigationTreeComponent.js.map