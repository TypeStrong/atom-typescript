"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atomUtils = require("../../utils");
const etch = require("etch");
const lodash_1 = require("lodash");
const navigationNodeComponent_1 = require("./navigationNodeComponent");
const navTreeUtils_1 = require("./navTreeUtils");
class NavigationTreeComponent {
    constructor(props) {
        this.props = props;
        this.loadNavTree = async () => {
            if (!this.editor)
                return;
            if (!this.withTypescriptBuffer)
                return;
            const filePath = this.editor.getPath();
            if (filePath === undefined)
                return;
            try {
                return await this.withTypescriptBuffer(filePath, async (buffer) => {
                    const navTree = await buffer.getNavTree();
                    if (navTree) {
                        this.setNavTree(navTree);
                        await etch.update(this);
                    }
                });
            }
            catch (err) {
                console.error(err, filePath);
            }
        };
        /**
         * HELPER select the node's HTML represenation which corresponds to the
         *        current cursor position
         */
        this.selectAtCursorLine = ({ newBufferPosition }) => {
            if (!this.props.navTree) {
                return;
            }
            const cursorLine = newBufferPosition.row;
            const selectedChild = navTreeUtils_1.findNodeAt(cursorLine, cursorLine, this.props.navTree);
            if (selectedChild !== this.selectedNode) {
                this.selectedNode = selectedChild;
                etch.update(this);
            }
        };
        this.subscribeToEditor = (editor) => {
            if (!editor || !atomUtils.isTypescriptEditorWithPath(editor)) {
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
            this.editor = editor;
            // set navTree
            this.loadNavTree();
            // Subscribe to stop scrolling
            if (this.editorScrolling) {
                this.editorScrolling.dispose();
            }
            this.editorScrolling = editor.onDidChangeCursorPosition(this.selectAtCursorLine);
            if (this.editorChanging) {
                this.editorChanging.dispose();
            }
            this.editorChanging = editor.onDidStopChanging(this.loadNavTree);
        };
        navTreeUtils_1.prepareNavTree(props.navTree);
        etch.initialize(this);
        atom.workspace.observeActiveTextEditor(this.subscribeToEditor);
    }
    async update(props) {
        if (props.navTree !== undefined) {
            this.setNavTree(props.navTree);
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
        this.selectedNode = undefined;
        await etch.destroy(this);
    }
    setWithTypescriptBuffer(wtb) {
        this.withTypescriptBuffer = wtb;
        this.loadNavTree();
    }
    getSelectedNode() {
        return this.selectedNode;
    }
    render() {
        const maybeNavNodeComp = this.props.navTree ? (etch.dom(navigationNodeComponent_1.NavigationNodeComponent, { navTree: this.props.navTree, ctrl: this })) : null;
        return (etch.dom("div", { class: "atomts atomts-semantic-view native-key-bindings" },
            etch.dom("ol", { className: "list-tree has-collapsable-children focusable-panel" }, maybeNavNodeComp)));
    }
    readAfterUpdate() {
        // scroll to selected node:
        const selectedElement = this.element.querySelector(".selected");
        if (selectedElement)
            this.scrollTo(selectedElement);
    }
    /**
     * HELPER scroll the current editor so that the node's representation becomes
     *        visible
     *        (i.e. scroll the text/typescript editor)
     * @param  {NavigationTree} node
     *              the node which's element should be made visible in the editor
     */
    gotoNode(node) {
        if (!this.editor)
            return;
        const gotoLine = navTreeUtils_1.getNodeStartLine(node);
        const gotoOffset = navTreeUtils_1.getNodeStartOffset(node);
        this.editor.setCursorBufferPosition([gotoLine, gotoOffset]);
    }
    getCursorLine() {
        if (this.editor)
            return this.editor.getLastCursor().getBufferRow();
        else
            return undefined;
    }
    async setNavTree(navTree) {
        navTreeUtils_1.prepareNavTree(navTree);
        if (lodash_1.isEqual(navTree, this.props.navTree)) {
            return;
        }
        navTreeUtils_1.restoreCollapsed(navTree, this.props.navTree);
        this.props.navTree = navTree;
        let selectedNode;
        if (navTree) {
            const cursorLine = this.getCursorLine();
            if (cursorLine !== undefined) {
                selectedNode = navTreeUtils_1.findNodeAt(cursorLine, cursorLine, navTree);
            }
        }
        this.selectedNode = selectedNode;
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
}
exports.NavigationTreeComponent = NavigationTreeComponent;
//# sourceMappingURL=navigationTreeComponent.js.map