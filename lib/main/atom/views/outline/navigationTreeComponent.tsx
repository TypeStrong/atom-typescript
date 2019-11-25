import {CompositeDisposable, CursorPositionChangedEvent, Disposable, TextEditor} from "atom"
import * as etch from "etch"
import {isEqual} from "lodash"
import {NavigationTree} from "typescript/lib/protocol"
import {GetClientFunction} from "../../../../client"
import {handlePromise} from "../../../../utils"
import atomUtils = require("../../utils")
import {NavigationNodeComponent} from "./navigationNodeComponent"
import {
  findNodeAt,
  getNodeStartLine,
  getNodeStartOffset,
  prepareNavTree,
  restoreCollapsed,
} from "./navTreeUtils"
import {NavigationTreeViewModel, SelectableNode, ToNodeScrollableEditor} from "./semanticViewModel"

export interface Props extends JSX.Props {
  navTree: NavigationTreeViewModel | null
}

export class NavigationTreeComponent
  implements JSX.ElementClass, ToNodeScrollableEditor, SelectableNode {
  public element!: HTMLDivElement
  private editor?: TextEditor
  private editorScrolling?: Disposable
  private editorChanging?: Disposable
  private selectedNode?: NavigationTreeViewModel
  private getClient?: GetClientFunction
  private subscriptions = new CompositeDisposable()

  constructor(public props: Props) {
    prepareNavTree(props.navTree)
    etch.initialize(this)
    this.subscriptions.add(atom.workspace.observeActiveTextEditor(this.subscribeToEditor))
  }

  public async update(props: Partial<Props>) {
    if (props.navTree !== undefined) {
      this.setNavTree(props.navTree)
    }
    this.props = {...this.props, ...props}
    await etch.update(this)
  }

  public async destroy() {
    if (this.editorScrolling) this.editorScrolling.dispose()
    if (this.editorChanging) this.editorChanging.dispose()
    this.editorScrolling = undefined
    this.editorChanging = undefined
    this.selectedNode = undefined
    this.subscriptions.dispose()
    await etch.destroy(this)
  }

  public async setGetClient(getClient: GetClientFunction) {
    this.getClient = getClient
    await this.loadNavTree()
  }

  public getSelectedNode() {
    return this.selectedNode
  }

  public render() {
    const maybeNavNodeComp = this.props.navTree ? (
      <NavigationNodeComponent navTree={this.props.navTree} ctrl={this} />
    ) : null
    return (
      <div className="atomts atomts-semantic-view native-key-bindings">
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

  private getCursorLine(): number | undefined {
    if (this.editor) return this.editor.getLastCursor().getBufferRow()
    else return undefined
  }

  private setNavTree(navTree: NavigationTreeViewModel | null) {
    prepareNavTree(navTree)
    if (isEqual(navTree, this.props.navTree)) {
      return
    }
    restoreCollapsed(navTree, this.props.navTree)
    this.props.navTree = navTree

    let selectedNode: NavigationTreeViewModel | undefined
    if (navTree) {
      const cursorLine = this.getCursorLine()
      if (cursorLine !== undefined) {
        selectedNode = findNodeAt(cursorLine, cursorLine, navTree)
      }
    }
    this.selectedNode = selectedNode
  }

  private loadNavTree = async () => {
    if (!this.editor) return
    if (!this.getClient) return
    const filePath = this.editor.getPath()
    if (filePath === undefined) return
    try {
      const client = await this.getClient(filePath)
      const navtreeResult = await client.execute("navtree", {file: filePath})
      const navTree = navtreeResult.body
      if (navTree) {
        this.setNavTree(navTree as NavigationTreeViewModel)
        await etch.update(this)
      }
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
    if (selectedChild !== this.selectedNode) {
      this.selectedNode = selectedChild
      handlePromise(etch.update(this))
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

  private subscribeToEditor = async (editor?: TextEditor) => {
    if (this.editorScrolling) this.editorScrolling.dispose()
    if (this.editorChanging) this.editorChanging.dispose()

    if (!editor || !atomUtils.isTypescriptEditorWithPath(editor)) {
      return this.update({navTree: null})
    }
    // else
    this.editor = editor
    // set navTree
    await this.loadNavTree()

    this.editorScrolling = editor.onDidChangeCursorPosition(this.selectAtCursorLine)
    this.editorChanging = editor.onDidStopChanging(this.loadNavTree)
  }
}
