"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atomUtils = require("../../utils");
const atomts_1 = require("../../../atomts");
const etch = require("etch");
const lodash_1 = require("lodash");
const navigationNodeComponent_1 = require("./navigationNodeComponent");
const navTreeUtils_1 = require("./navTreeUtils");
class NavigationTreeComponent {
    constructor(props) {
        this.props = props;
        this.positionState = {
            lastCursorLine: 0,
            selectedNode: null,
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
        this.setSelectedNode(null);
        navTreeUtils_1.prepareNavTree(props.navTree);
        etch.initialize(this);
        atom.workspace.observeActiveTextEditor(this.subscribeToEditor);
    }
    async update(props) {
        if (props.navTree) {
            navTreeUtils_1.prepareNavTree(props.navTree);
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
        this.setSelectedNode(null);
        await etch.destroy(this);
    }
    setEditor(editor) {
        this.editor = editor;
    }
    async setNavTree(navTree) {
        navTreeUtils_1.prepareNavTree(navTree);
        if (lodash_1.isEqual(navTree, this.props.navTree)) {
            return;
        }
        navTreeUtils_1.restoreCollapsed(navTree, this.props.navTree);
        this.props.navTree = navTree;
        this.setSelectedNode(null);
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
    updateLastCursorPosition() {
        this.positionState.lastCursorLine =
            this.editor && this.editor.getLastCursor() ? this.editor.getLastCursor().getBufferRow() : null;
    }
    setSelectedNode(selectedNode) {
        this.positionState.selectedNode = selectedNode;
    }
    render() {
        this.updateLastCursorPosition();
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
    /**
     * HELPER select the node's HTML represenation which corresponds to the
     *        current cursor position
     */
    selectAtCursorLine() {
        this.updateLastCursorPosition();
        const cursorLine = this.positionState.lastCursorLine;
        if (!cursorLine || !this.props.navTree || !this.refs.main) {
            return;
        }
        const selectedChild = navTreeUtils_1.findNodeAt(cursorLine, cursorLine, this.props.navTree);
        if (selectedChild !== null) {
            // console.log("select at cursor-line " + cursorLine, selectedChild) // DEBUG
            this.setSelectedNode(selectedChild);
            etch.update(this);
        }
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
        const gotoLine = navTreeUtils_1.getNodeStartLine(node);
        const gotoOffset = navTreeUtils_1.getNodeStartOffset(node);
        this.editor.setCursorBufferPosition([gotoLine, gotoOffset]);
    }
}
exports.NavigationTreeComponent = NavigationTreeComponent;
//# sourceMappingURL=navigationTreeComponent.js.map