"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const etch = require("etch");
const lodash_1 = require("lodash");
const utils_1 = require("../../../../utils");
const atomUtils = require("../../utils");
const navigationNodeComponent_1 = require("./navigationNodeComponent");
const navTreeUtils_1 = require("./navTreeUtils");
class NavigationTreeComponent {
    constructor(props) {
        this.props = props;
        this.subscriptions = new atom_1.CompositeDisposable();
        this.loadNavTree = async () => {
            if (!this.editor)
                return;
            if (!this.getClient)
                return;
            const filePath = this.editor.getPath();
            if (filePath === undefined)
                return;
            try {
                const client = await this.getClient(filePath);
                const navtreeResult = await client.execute("navtree", { file: filePath });
                const navTree = navtreeResult.body;
                if (navTree) {
                    this.setNavTree(navTree);
                    await etch.update(this);
                }
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
                utils_1.handlePromise(etch.update(this));
            }
        };
        this.subscribeToEditor = async (editor) => {
            if (this.editorScrolling)
                this.editorScrolling.dispose();
            if (this.editorChanging)
                this.editorChanging.dispose();
            if (!editor || !atomUtils.isTypescriptEditorWithPath(editor)) {
                return this.update({ navTree: null });
            }
            // else
            this.editor = editor;
            // set navTree
            await this.loadNavTree();
            this.editorScrolling = editor.onDidChangeCursorPosition(this.selectAtCursorLine);
            this.editorChanging = editor.onDidStopChanging(this.loadNavTree);
        };
        navTreeUtils_1.prepareNavTree(props.navTree);
        etch.initialize(this);
        this.subscriptions.add(atom.workspace.observeActiveTextEditor(this.subscribeToEditor));
    }
    async update(props) {
        if (props.navTree !== undefined) {
            this.setNavTree(props.navTree);
        }
        this.props = Object.assign(Object.assign({}, this.props), props);
        await etch.update(this);
    }
    async destroy() {
        if (this.editorScrolling)
            this.editorScrolling.dispose();
        if (this.editorChanging)
            this.editorChanging.dispose();
        this.editorScrolling = undefined;
        this.editorChanging = undefined;
        this.selectedNode = undefined;
        this.subscriptions.dispose();
        await etch.destroy(this);
    }
    async setGetClient(getClient) {
        this.getClient = getClient;
        await this.loadNavTree();
    }
    getSelectedNode() {
        return this.selectedNode;
    }
    render() {
        const maybeNavNodeComp = this.props.navTree ? (etch.dom(navigationNodeComponent_1.NavigationNodeComponent, { navTree: this.props.navTree, ctrl: this })) : null;
        return (etch.dom("div", { className: "atomts atomts-semantic-view native-key-bindings" },
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
    setNavTree(navTree) {
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