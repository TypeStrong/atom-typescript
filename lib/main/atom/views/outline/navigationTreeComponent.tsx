import atomUtils = require("../../utils")
import {Disposable, TextEditor, CursorPositionChangedEvent} from "atom"
import * as etch from "etch"
import {isEqual} from "lodash"
import {NavigationTree} from "typescript/lib/protocol"
import {NavigationTreeViewModel, ToNodeScrollableEditor, SelectableNode} from "./semanticViewModel"
import {NavigationNodeComponent} from "./navigationNodeComponent"
import {
  findNodeAt,
  getNodeStartLine,
  getNodeStartOffset,
  restoreCollapsed,
  prepareNavTree,
} from "./navTreeUtils"
import {WithTypescriptBuffer} from "../../../plugin-manager"

export interface Props extends JSX.Props {
  navTree: NavigationTreeViewModel | null
}

export class NavigationTreeComponent
  implements JSX.ElementClass, ToNodeScrollableEditor, SelectableNode {
  public element: HTMLDivElement
  private editor?: TextEditor
  private editorScrolling?: Disposable
  private editorChanging?: Disposable
  private selectedNode: NavigationTreeViewModel | null = null
  private withTypescriptBuffer?: WithTypescriptBuffer

  constructor(public props: Props) {
    prepareNavTree(props.navTree)
    etch.initialize(this)
    atom.workspace.observeActiveTextEditor(this.subscribeToEditor)
  }

  public async update(props: Partial<Props>) {
    if (props.navTree) {
      this.setNavTree(props.navTree)
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
    this.selectedNode = null
    await etch.destroy(this)
  }

  public setWithTypescriptBuffer(wtb: WithTypescriptBuffer) {
    this.withTypescriptBuffer = wtb
  }

  public getSelectedNode() {
    return this.selectedNode
  }

  public render() {
    const maybeNavNodeComp = this.props.navTree ? (
      <NavigationNodeComponent navTree={this.props.navTree} ctrl={this} />
    ) : null
    return (
      <div class="atomts atomts-semantic-view native-key-bindings">
        <ol className="list-tree has-collapsable-children focusable-panel">{maybeNavNodeComp}</ol>
      </div>
    )
  }

  public readAfterUpdate() {
    // scroll to selected node:
    const selectedElement = this.element.querySelector(".selected")
    if (selectedElement) this.scrollTo(selectedElement)
  }

  /**
   * HELPER scroll the current editor so that the node's representation becomes
   *        visible
   *        (i.e. scroll the text/typescript editor)
   * @param  {NavigationTree} node
   *              the node which's element should be made visible in the editor
   */
  public gotoNode(node: NavigationTree): void {
    if (!this.editor) return
    const gotoLine = getNodeStartLine(node)
    const gotoOffset = getNodeStartOffset(node)
    this.editor.setCursorBufferPosition([gotoLine, gotoOffset])
  }

  private getCursorLine(): number | null {
    return this.editor && this.editor.getLastCursor()
      ? this.editor.getLastCursor().getBufferRow()
      : null
  }

  private async setNavTree(navTree: NavigationTreeViewModel | null) {
    prepareNavTree(navTree)
    if (isEqual(navTree, this.props.navTree)) {
      return
    }
    restoreCollapsed(navTree, this.props.navTree)
    this.props.navTree = navTree

    let selectedNode: NavigationTreeViewModel | null = null
    if (navTree !== null) {
      const cursorLine = this.getCursorLine()
      if (cursorLine !== null) {
        selectedNode = findNodeAt(cursorLine, cursorLine, navTree)
      }
    }
    this.selectedNode = selectedNode
  }

  private loadNavTree = async () => {
    if (!this.editor) return
    if (!this.withTypescriptBuffer) return
    const filePath = this.editor.getPath()
    if (!filePath) return
    try {
      return await this.withTypescriptBuffer(filePath, async buffer => {
        const navTree = await buffer.getNavTree()
        if (navTree) {
          this.setNavTree(navTree as NavigationTreeViewModel)
          await etch.update(this)
        }
      })
    } catch (err) {
      console.error(err, filePath)
    }
  }

  /**
   * HELPER select the node's HTML represenation which corresponds to the
   *        current cursor position
   */
  private selectAtCursorLine = ({newBufferPosition}: CursorPositionChangedEvent) => {
    if (!this.props.navTree) {
      return
    }
    const cursorLine = newBufferPosition.row

    const selectedChild = findNodeAt(cursorLine, cursorLine, this.props.navTree)
    if (selectedChild !== null) {
      // console.log("select at cursor-line " + cursorLine, selectedChild) // DEBUG
      this.selectedNode = selectedChild
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

  private subscribeToEditor = (editor?: TextEditor) => {
    if (!editor || !atomUtils.isTypescriptEditorWithPath(editor)) {
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
    this.editor = editor

    // set navTree
    this.loadNavTree()

    // Subscribe to stop scrolling
    if (this.editorScrolling) {
      this.editorScrolling.dispose()
    }
    this.editorScrolling = editor.onDidChangeCursorPosition(this.selectAtCursorLine)

    if (this.editorChanging) {
      this.editorChanging.dispose()
    }
    this.editorChanging = editor.onDidStopChanging(this.loadNavTree)
  }
}
