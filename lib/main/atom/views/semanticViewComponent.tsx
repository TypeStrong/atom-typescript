import atomUtils = require("../utils")
import {Disposable, TextEditor} from "atom"
import {clientResolver} from "../../atomts"
import * as etch from "etch"
import {isEqual} from "lodash"
import {NavigationTree} from "typescript/lib/protocol"

export interface Props extends JSX.Props {
  navTree: NavigationTreeExt
}

// interface for attaching some HELPER fields to the NavigationTree
export interface NavigationTreeExt extends NavigationTree {
  styleClasses: string
  childItems?: NavigationTreeExt[]
}

// experimental interface for Element, see https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
interface ElementExt extends Element {
  closest(seletor: string): Element | null
}

export class SemanticViewComponent implements JSX.ElementClass {
  private editor: TextEditor
  public refs: {
    main: HTMLDivElement
  }
  private selectedNode: HTMLElement | null

  private editorScrolling: Disposable
  private editorChanging: Disposable
  private activeEditorChanging: Disposable

  constructor(public props: Props) {
    this.selectedNode = null
    etch.initialize(this)
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

  private async setNavTree(navTree: NavigationTree | null) {
    this.prepareNavTree(navTree as NavigationTreeExt)
    if (isEqual(navTree, this.props.navTree)) {
      return
    }
    this.props = {navTree: navTree as NavigationTreeExt}
    await etch.update(this)
  }

  public async forceUpdate() {
    await etch.update(this)
  }

  private async loadNavTree(filePath?: string) {
    filePath = filePath ? filePath : this.editor.getPath()
    // const client = await clientResolver.get(filePath);
    if (filePath) {
      try {
        const client = await clientResolver.get(filePath)
        await client.executeOpen({file: filePath})
        const navtreeResult = await client.executeNavTree({file: filePath as string})
        const navTree = navtreeResult ? (navtreeResult.body as NavigationTree) : void 0
        if (navTree) {
          this.setNavTree(navTree)
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
   * @param {NavigationTreeExt} navTree
   *            the NavigationTree that will be prepared for rendering
   */
  private prepareNavTree(navTree: NavigationTreeExt): void {
    navTree.styleClasses = this.getIconForKind(navTree.kind)
    const modifiersClasses = this.getClassForKindModifiers(navTree.kindModifiers)
    if (modifiersClasses) {
      navTree.styleClasses += " " + modifiersClasses
    }

    if (navTree.childItems) {
      if (navTree.childItems.length < 1) {
        // normalize: remove empty lists
        navTree.childItems = void 0
        return
      }

      // TODO should there be a different sort-order?
      //     for now: sort ascending by line-number
      navTree.childItems.sort((a, b) => this.getNodeStartLine(a) - this.getNodeStartLine(b))

      let child: NavigationTreeExt
      for (child of navTree.childItems) {
        this.prepareNavTree(child)
      }
    }
  }

  // TODO refactor/rename this function if/when React is abandoned
  componentDidMount() {
    const subscribeToEditor = (editor: TextEditor) => {
      if (!editor) {
        unsubscribeFromEditor()
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

    const unsubscribeFromEditor = () => {
      // dispose subscriptions (except for editor-changing)
      if (this.editorScrolling) {
        this.editorScrolling.dispose()
      }
      if (this.editorChanging) {
        this.editorChanging.dispose()
      }

      // clear view:
      // this.navTree = null
      // this.forceUpdate()
      this.update({navTree: {} as NavigationTreeExt})
    }

    // We don't start unless there is work to do ... so work
    const activeEditor = atom.workspace.getActiveTextEditor()
    if (activeEditor) {
      subscribeToEditor(activeEditor) // atomUtils.getActiveEditor())
    }

    // Editor changing
    this.activeEditorChanging = atom.workspace.onDidChangeActiveTextEditor(
      (editor: TextEditor | undefined) => {
        if (editor && atomUtils.onDiskAndTs(editor)) {
          subscribeToEditor(editor)
        } else {
          unsubscribeFromEditor()
        }
      },
    )
  }

  // /**
  //  * Actually component will never unmount ... so no unsubs for now
  //  */
  // componentWillUnmount() {} // see destroy()

  whileRendering: {lastCursorLine: number | null} = {
    lastCursorLine: 0,
  }

  render() {
    // node?: HTMLElement): void {
    // this.root = node ? node : this.root
    // if (!this.root) {
    //   console.error("cannot render: not initialized yet.")
    //   return ////////////// EARLY EXIT /////////////////
    // }
    this.whileRendering = {
      lastCursorLine:
        this.editor && this.editor.getLastCursor()
          ? this.editor.getLastCursor().getBufferRow()
          : null,
    }
    this.selectedNode = null
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
    return (
      <ol ref="main" className="list-tree has-collapsable-children focusable-panel">
        {this.renderNode(this.props.navTree)}
      </ol>
    )
  }

  public writeAfterUpdate() {
    // TODO should this use hook readAfterUpdate() instead?
    if (this.selectedNode) this.scrollTo(this.selectedNode)
  }

  private getNodeStartLine(node: NavigationTree): number {
    // console.log('getNodeStartLine.node -> ', node)
    return node && node.spans ? node.spans[0].start.line - 1 : 0
  }

  private getNodeEndLine(node: NavigationTree): number {
    const s = node!.spans
    return s ? s[s.length - 1].end.line - 1 : 0
  }

  private getDomNodeStartLine(elem: HTMLElement): number {
    // return parseInt(elem.dataset.start as string, 10)
    return parseInt((elem as any)["data-start"] as string, 10)
  }

  private getDomNodeEndLine(elem: HTMLElement): number {
    // return parseInt(elem.dataset.end as string, 10)
    return parseInt((elem as any)["data-end"] as string, 10)
  }

  private renderNode(node: NavigationTree): JSX.Element {
    // const selected = this.isSelected(node) TODO find way to set initial selection

    const domNode: JSX.Element = (
      <li
        className={"node entry exanded list-" + (node.childItems ? "nested-" : "") + "item"}
        data-start={this.getNodeStartLine(node) + ""}
        data-end={this.getNodeEndLine(node) + ""}>
        <div className="header list-item" on={{click: event => this.entryClicked(event, node)}}>
          <span className={(node as NavigationTreeExt).styleClasses}>{node.text || ""}</span>
        </div>
        <ol className="entries list-tree">
          {node.childItems ? node.childItems.map(sn => this.renderNode(sn)) : ""}
        </ol>
      </li>
    )

    // set selected
    // this.setSelected(domNode, selected) TODO find way to set initial selection

    return domNode
  }

  private entryClicked(event: MouseEvent, node: NavigationTree): void {
    const target = (event.target as ElementExt).closest(".node")
    const isToggle: boolean = this.isToggleEntry(target, event)
    // console.log(isToggle ? "click-toggle" : "click-scroll")

    if (!isToggle) {
      this.gotoNode(node)
    } else if (target) {
      const isCollapsed = target.classList.contains("collapsed")
      if (isCollapsed) {
        this.expandEntry(target)
      } else {
        this.collapseEntry(target)
      }
    }
    event.stopPropagation()
  }

  public collapseEntry(target: Element): void {
    target.classList.add("collapsed")
    target.classList.remove("expanded")
  }

  public expandEntry(target: Element): void {
    target.classList.add("expanded")
    target.classList.remove("collapsed")
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
  private isToggleEntry(nodeEntry: ElementExt | null, event: MouseEvent): boolean {
    if (!nodeEntry || !event.target) {
      return false
    }
    let isToggle: boolean = nodeEntry.classList.contains("list-nested-item")
    // only continue, if entry as sub-entries (i.e. is nested list item):
    if (isToggle) {
      const target = event.target as Element
      // only toggle, if label-wrapper, i.e. element <span class="header list-item"> was clicked
      //  (since the "label-wrapper" has the expand/collapse icon attached via its ::before style)
      if (!target.classList.contains("header") || !target.classList.contains("list-item")) {
        isToggle = false
      }
    }

    return isToggle
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
   * HELPER test if <code>childNode</code> is a child of <code>node</code>
   * @param  {HTMLElement} childNode
   *            the node to be tested
   * @param  {HTMLElement} node
   *            the (potential) parent node
   * @return {Boolean} true, if node is a parent of childNode
   */
  private isChild(childNode: HTMLElement, node: HTMLElement): boolean {
    let parent = childNode.parentNode
    while (parent !== node && parent !== null) {
      parent = parent.parentNode
    }
    return parent === node
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
  protected isSelected(node: NavigationTree): boolean {
    if (this.whileRendering.lastCursorLine == null) return false
    else {
      if (
        this.getNodeStartLine(node) <= this.whileRendering.lastCursorLine &&
        this.getNodeEndLine(node) >= this.whileRendering.lastCursorLine
      ) {
        return true
      }
      return false
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
  setSelected(domNode: HTMLElement, selected: boolean, forceSelection?: boolean): void {
    if (selected) {
      let setSelected: boolean = true
      if (this.selectedNode) {
        // do not select, if there is a node selected "further down"
        if (!forceSelection && this.isChild(this.selectedNode, domNode)) {
          setSelected = false
        }
      }

      if (setSelected) {
        if (this.selectedNode === domNode) {
          return
        }

        if (this.selectedNode) {
          this.selectedNode.classList.remove("selected")
        }

        domNode.classList.add("selected")
        this.selectedNode = domNode
      }
    }
  }

  /**
   * HELPER select the node's HTML represenation which corresponds to the
   *        current cursor position
   */
  selectAtCursorLine(): void {
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

    const selectedChild = this.findNodeAtCursorLine(this.refs.main, cursorLine)
    if (selectedChild !== null) {
      // console.log('select at cursor-line '+cursorLine, selectedChild);
      this.setSelected(selectedChild, true, true)
      this.scrollTo(selectedChild)
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
  private findNodeAtCursorLine(domNode: HTMLElement, cursorLine: number): HTMLElement | null {
    if (!domNode.children) {
      return null
    }

    for (let i = 0, size = domNode.childElementCount; i < size; ++i) {
      const elem = domNode.children[i] as HTMLElement
      let selectedChild: HTMLElement | null = null
      if (elem.dataset) {
        const start: number = this.getDomNodeStartLine(elem)
        const end: number = this.getDomNodeEndLine(elem)
        if (isFinite(start) && isFinite(end)) {
          if (cursorLine >= start && cursorLine <= end) {
            selectedChild = this.findNodeAtCursorLine(elem, cursorLine)
            if (selectedChild) {
              return selectedChild
            }
          } else if (isFinite(end) && cursorLine < end) {
            break
          }
        }
      }

      selectedChild = this.findNodeAtCursorLine(elem, cursorLine)

      if (selectedChild) {
        return selectedChild
      }
    }

    if (domNode.dataset) {
      const start: number = this.getDomNodeStartLine(domNode)
      const end: number = this.getDomNodeEndLine(domNode)
      if (isFinite(start) && isFinite(end) && cursorLine >= start && cursorLine <= end) {
        return domNode
      }
    }

    return null
  }

  /**
   * HELPER scroll the node's HTML representation (i.e. domNode) into view
   *        (i.e. scroll the semantic-view's tree representation)
   * @param  {HTMLElement} domNode the HTMLElement that should be made visisble
   */
  scrollTo(domNode: HTMLElement): void {
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
    this.editor.setCursorBufferPosition([gotoLine, 0])
  }
}
