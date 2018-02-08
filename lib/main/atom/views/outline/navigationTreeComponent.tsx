import atomUtils = require("../../utils")
import {Disposable, TextEditor} from "atom"
import {clientResolver} from "../../../atomts"
import * as etch from "etch"
import {isEqual} from "lodash"
import {NavigationTree} from "typescript/lib/protocol"
import {NavigationTreeViewModel, Props, PositionState} from "./semanticViewModel"
import {NavigationNodeComponent} from "./navigationNodeComponent"
import {
  findNodeAt,
  getNodeStartLine,
  getNodeStartOffset,
  restoreCollapsed,
  prepareNavTree,
} from "./navTreeUtils"

export class NavigationTreeComponent implements JSX.ElementClass {
  private editor: TextEditor
  public element: HTMLDivElement
  private refs: {
    main: HTMLOListElement
  }

  private editorScrolling: Disposable
  private editorChanging: Disposable

  constructor(public props: Props) {
    this.setSelectedNode(null)
    prepareNavTree(props.navTree)
    etch.initialize(this)
    atom.workspace.observeActiveTextEditor(this.subscribeToEditor)
  }

  public async update(props: Partial<Props>) {
    if (props.navTree) {
      prepareNavTree(props.navTree)
    }
    this.props = {...this.props, ...props}
    await etch.update(this)
  }

  public async destroy() {
    if (this.editorScrolling) {
      this.editorScrolling.dispose()
    }
    if (this.editorChanging) {
      this.editorChanging.dispose()
    }
    this.setSelectedNode(null)
    await etch.destroy(this)
  }

  private setEditor(editor: TextEditor) {
    this.editor = editor
  }

  private async setNavTree(navTree: NavigationTreeViewModel | null) {
    prepareNavTree(navTree)
    if (isEqual(navTree, this.props.navTree)) {
      return
    }
    restoreCollapsed(navTree, this.props.navTree)
    this.props.navTree = navTree
    this.setSelectedNode(null)
    await etch.update(this)
  }

  private async loadNavTree() {
    const filePath = this.editor.getPath()
    if (filePath) {
      try {
        const client = await clientResolver.get(filePath)
        await client.executeOpen({file: filePath})
        const navtreeResult = await client.executeNavTree({file: filePath})
        const navTree = navtreeResult.body
        if (navTree) {
          this.setNavTree(navTree as NavigationTreeViewModel)
        }
      } catch (err) {
        console.error(err, filePath)
      }
    }
  }

  private positionState: PositionState = {
    lastCursorLine: 0,
    selectedNode: null,
  }

  private updateLastCursorPosition() {
    this.positionState.lastCursorLine =
      this.editor && this.editor.getLastCursor() ? this.editor.getLastCursor().getBufferRow() : null
  }

  private setSelectedNode(selectedNode: NavigationTreeViewModel | null) {
    this.positionState.selectedNode = selectedNode
  }

  render() {
    this.updateLastCursorPosition()
    return (
      <div class="atomts atomts-semantic-view native-key-bindings">
        <ol ref="main" className="list-tree has-collapsable-children focusable-panel">
          <NavigationNodeComponent navTree={this.props.navTree} root={this} />
        </ol>
      </div>
    )
  }

  public readAfterUpdate() {
    // scroll to selected node:
    const selectedElement = this.refs.main.getElementsByClassName("selected")[0]
    if (selectedElement) this.scrollTo(selectedElement)
  }

  /**
   * HELPER select the node's HTML represenation which corresponds to the
   *        current cursor position
   */
  private selectAtCursorLine(): void {
    this.updateLastCursorPosition()

    const cursorLine = this.positionState.lastCursorLine
    if (!cursorLine || !this.props.navTree || !this.refs.main) {
      return
    }

    const selectedChild = findNodeAt(cursorLine, cursorLine, this.props.navTree)
    if (selectedChild !== null) {
      // console.log("select at cursor-line " + cursorLine, selectedChild) // DEBUG
      this.setSelectedNode(selectedChild)
      etch.update(this)
    }
  }

  /**
   * HELPER scroll the node's HTML representation (i.e. domNode) into view
   *        (i.e. scroll the semantic-view's tree representation)
   * @param  {Element} domNode the HTMLElement that should be made visisble
   */
  private scrollTo(domNode: Element): void {
    const elem: ElementExp = domNode as ElementExp
    if (typeof elem.scrollIntoViewIfNeeded === "function") {
      elem.scrollIntoViewIfNeeded()
    } else {
      elem.scrollIntoView()
    }
  }

  /**
   * HELPER scroll the current editor so that the node's representation becomes
   *        visible
   *        (i.e. scroll the text/typescript editor)
   * @param  {NavigationTree} node
   *              the node which's element should be made visible in the editor
   */
  gotoNode(node: NavigationTree): void {
    const gotoLine = getNodeStartLine(node)
    const gotoOffset = getNodeStartOffset(node)
    this.editor.setCursorBufferPosition([gotoLine, gotoOffset])
  }

  private subscribeToEditor = (editor?: TextEditor) => {
    if (!editor || !atomUtils.onDiskAndTs(editor)) {
      // unsubscribe from editor
      // dispose subscriptions (except for editor-changing)
      if (this.editorScrolling) {
        this.editorScrolling.dispose()
      }
      if (this.editorChanging) {
        this.editorChanging.dispose()
      }

      this.update({navTree: null})
      return
    }
    this.setEditor(editor)

    // set navTree
    this.loadNavTree()

    // Subscribe to stop scrolling
    if (this.editorScrolling) {
      this.editorScrolling.dispose()
    }
    this.editorScrolling = editor.onDidChangeCursorPosition(() => {
      this.selectAtCursorLine()
    })

    if (this.editorChanging) {
      this.editorChanging.dispose()
    }
    this.editorChanging = editor.onDidStopChanging(() => {
      // set navTree
      this.loadNavTree()
    })
  }
}
