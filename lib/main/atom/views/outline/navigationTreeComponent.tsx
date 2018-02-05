import atomUtils = require("../../utils")
import {Disposable, TextEditor} from "atom"
import {clientResolver} from "../../../atomts"
import * as etch from "etch"
import {isEqual} from "lodash"
import {NavigationTree} from "typescript/lib/protocol"
import {NavigationTreeViewModel, Props} from "./semanticViewModel"
import {NavigationNodeComponent} from "./navigationNodeComponent"

export class NavigationTreeComponent implements JSX.ElementClass {
  private editor: TextEditor
  public element: HTMLDivElement
  private refs: {
    main: HTMLOListElement
  }
  public selectedNode: NavigationTreeViewModel | null

  private editorScrolling: Disposable
  private editorChanging: Disposable
  private activeEditorChanging: Disposable

  constructor(public props: Props) {
    this.selectedNode = null
    this.prepareNavTree(props.navTree)
    etch.initialize(this)
    atom.workspace.observeActiveTextEditor(this.subscribeToEditor)
  }

  public async update(props: Partial<Props>) {
    if (props.navTree) {
      this.prepareNavTree(props.navTree)
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
    if (this.activeEditorChanging) {
      this.activeEditorChanging.dispose()
    }
    this.selectedNode = null
    await etch.destroy(this)
  }

  private setEditor(editor: TextEditor) {
    this.editor = editor
  }

  private async setNavTree(navTree: NavigationTreeViewModel | null) {
    this.prepareNavTree(navTree)
    if (isEqual(navTree, this.props.navTree)) {
      return
    }
    this.restoreCollapsed(navTree, this.props.navTree)
    this.props.navTree = navTree
    this.selectedNode = null
    await etch.update(this)
  }

  public async forceUpdate() {
    await etch.update(this)
  }

  private async loadNavTree(filePath?: string) {
    filePath = filePath ? filePath : this.editor.getPath()
    if (filePath) {
      try {
        const client = await clientResolver.get(filePath)
        await client.executeOpen({file: filePath})
        const navtreeResult = await client.executeNavTree({file: filePath as string})
        const navTree = navtreeResult ? navtreeResult.body! : undefined
        if (navTree) {
          this.setNavTree(navTree as NavigationTreeViewModel)
        }
      } catch (err) {
        console.error(err, filePath)
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
  private prepareNavTree(navTree: NavigationTreeViewModel | null): void {
    if (navTree === null) return
    navTree.styleClasses = this.getIconForKind(navTree.kind)
    const modifiersClasses = this.getClassForKindModifiers(navTree.kindModifiers)
    if (modifiersClasses) {
      navTree.styleClasses += " " + modifiersClasses
    }

    if (navTree.childItems) {
      if (navTree.childItems.length < 1) {
        // normalize: remove empty lists
        navTree.childItems = undefined
        return
      }

      // TODO should there be a different sort-order?
      //     for now: sort ascending by line-number
      navTree.childItems.sort((a, b) => this.getNodeStartLine(a) - this.getNodeStartLine(b))

      let child: NavigationTreeViewModel
      for (child of navTree.childItems) {
        this.prepareNavTree(child)
      }
    }
  }

  /**
   * HELPER transfere collapsed state from old NavigationTreeViewModel to new view model.
   *
   * @returns {boolean} TRUE, if newTree and oldTree matched title
   */
  private restoreCollapsed(
    newTree: NavigationTreeViewModel | null,
    oldTree: NavigationTreeViewModel | null,
  ): boolean {
    if (!newTree || !oldTree) return newTree == oldTree

    if (newTree.text === oldTree.text) {
      if (oldTree.collapsed) {
        newTree.collapsed = true
      }

      if (newTree.childItems && oldTree.childItems) {
        let newChild: NavigationTreeViewModel
        let oldChild: NavigationTreeViewModel
        for (let i = 0, size = newTree.childItems.length; i < size; ++i) {
          newChild = newTree.childItems[i]
          oldChild = oldTree.childItems[i]
          if (!this.restoreCollapsed(newChild, oldChild)) {
            // try, if a child was added
            oldChild = oldTree.childItems[i + 1]
            if (!this.restoreCollapsed(newChild, oldChild)) {
              // try, if a child was removed
              oldChild = oldTree.childItems[i - 1]
              this.restoreCollapsed(newChild, oldChild)
            }
          }
        }
      }
      return true
    }

    return false
  }

  private whileRendering: {lastCursorLine: number | null} = {
    lastCursorLine: 0,
  }

  render() {
    this.whileRendering = {
      lastCursorLine:
        this.editor && this.editor.getLastCursor()
          ? this.editor.getLastCursor().getBufferRow()
          : null,
    }
    return (
      <div class="atomts atomts-semantic-view native-key-bindings">
        <ol ref="main" className="list-tree has-collapsable-children focusable-panel">
          <NavigationNodeComponent {...{navTree: this.props.navTree, root: this}} />
        </ol>
      </div>
    )
  }

  public readAfterUpdate() {
    // scroll to selected node:
    const selectedElement = this.refs.main.getElementsByClassName("selected")[0]
    if (selectedElement) this.scrollTo(selectedElement)
  }

  public getNodeStartLine(node: NavigationTree): number {
    // console.log('getNodeStartLine.node -> ', node)
    return node && node.spans ? node.spans[0].start.line - 1 : 0
  }

  private getNodeStartOffset(node: NavigationTree): number {
    // console.log('getNodeStartLine.node -> ', node)
    return node && node.spans ? node.spans[0].start.offset - 1 : 0
  }

  public getNodeEndLine(node: NavigationTree): number {
    const s = node!.spans
    return s ? s[s.length - 1].end.line - 1 : 0
  }

  private getIconForKind(kind: string): string {
    return `icon icon-${kind}`
  }

  private getClassForKindModifiers(kindModifiers: string): string {
    if (!kindModifiers) {
      return ""
    } else if (kindModifiers.indexOf(" ") === -1 && kindModifiers.indexOf(",") === -1) {
      return `modifier-${kindModifiers}`
    } else {
      return kindModifiers
        .split(/[, ]/)
        .map(modifier => "modifier-" + modifier.trim())
        .join(" ")
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
  public isSelected(node: NavigationTreeViewModel): boolean {
    if (this.whileRendering.lastCursorLine == null) return false
    else {
      if (
        this.getNodeStartLine(node) <= this.whileRendering.lastCursorLine &&
        this.getNodeEndLine(node) >= this.whileRendering.lastCursorLine
      ) {
        const start: number = this.getNodeStartLine(node)
        const end: number = this.getNodeEndLine(node)
        if (this.findNodeAt(start, end, node)) {
          // -> there is a node "further down" that should get selected
          return false
        }
        return true
      }
      return false
    }
  }

  /**
   * HELPER select the node's HTML represenation which corresponds to the
   *        current cursor position
   */
  private selectAtCursorLine(): void {
    this.whileRendering = {
      lastCursorLine:
        this.editor && this.editor.getLastCursor()
          ? this.editor.getLastCursor().getBufferRow()
          : null,
    }

    const cursorLine = this.whileRendering.lastCursorLine
    if (!cursorLine || !this.props.navTree || !this.refs.main) {
      return
    }

    const selectedChild = this.findNodeAt(cursorLine, cursorLine, this.props.navTree)
    if (selectedChild !== null) {
      // console.log("select at cursor-line " + cursorLine, selectedChild) // DEBUG
      this.selectedNode = selectedChild
      etch.update(this)
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
  private findNodeAt(
    startLine: number,
    endLine: number,
    node: NavigationTreeViewModel,
  ): NavigationTreeViewModel | null {
    if (!node.childItems) {
      return null
    }

    for (const elem of node.childItems) {
      const start: number = this.getNodeStartLine(elem)
      const end: number = this.getNodeEndLine(elem)
      if (isFinite(start) && isFinite(end)) {
        if (startLine >= start && endLine <= end) {
          const selected = this.findNodeAt(startLine, endLine, elem)
          if (selected) {
            return selected
          } else {
            return elem
          }
        } else if (isFinite(end) && endLine < end) {
          break
        }
      }

      const selectedChild = this.findNodeAt(startLine, endLine, elem)

      if (selectedChild) {
        return selectedChild
      }
    }

    const nstart: number = this.getNodeStartLine(node)
    const nend: number = this.getNodeEndLine(node)
    if (isFinite(nstart) && isFinite(nend) && startLine >= nstart && endLine <= nend) {
      return node
    }
    return null
  }

  /**
   * HELPER scroll the node's HTML representation (i.e. domNode) into view
   *        (i.e. scroll the semantic-view's tree representation)
   * @param  {Element} domNode the HTMLElement that should be made visisble
   */
  private scrollTo(domNode: Element): void {
    const elem: any = domNode
    if (typeof elem.scrollIntoViewIfNeeded === "function") {
      elem.scrollIntoViewIfNeeded()
    } else if (typeof elem.scrollIntoView === "function") {
      elem.scrollIntoView()
    } // TODO else: impl. scroll
  }

  /**
   * HELPER scroll the current editor so that the node's representation becomes
   *        visible
   *        (i.e. scroll the text/typescript editor)
   * @param  {NavigationTree} node
   *              the node which's element should be made visible in the editor
   */
  gotoNode(node: NavigationTree): void {
    const gotoLine = this.getNodeStartLine(node)
    const gotoOffset = this.getNodeStartOffset(node)
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
    const filePath = editor.getPath()
    this.loadNavTree(filePath)

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
      const fPath = editor.getPath()
      this.loadNavTree(fPath)
    })
  }
}
