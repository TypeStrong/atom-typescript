import atomUtils = require("../utils")
import {CompositeDisposable} from "atom"
import {clientResolver} from "../../atomts"
import * as dom from "jsx-render-dom"
import {NavigationTree} from "typescript/lib/protocol"

//add some missing interface definitions to IWorkspace TODO transfere to typings/atom*
interface IWorkspaceExt extends AtomCore.IWorkspace {
  getPaneItems(): Array<AtomCore.IPane>
  toggle(item: AtomCore.IPane | string): Promise<void>
  hide(item: AtomCore.IPane | string): boolean
  onDidChangeActiveTextEditor(editor: any): AtomCore.Disposable
}

//interface for attaching some HELPER fields to the NavigationTree
interface NavigationTreeExt extends NavigationTree {
  styleClasses: string
  childItems?: NavigationTreeExt[]
}

//experimental interface for Element, see https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
interface ElementExt extends Element {
  closest(seletor: string): Element | null
}

const VIEW_URI = "atomts-semantic-view"

class SemanticViewRenderer {
  private editor: AtomCore.IEditor
  private navTree: NavigationTree | null
  private root: HTMLElement | null
  private selectedNode: HTMLElement | null

  private editorScrolling: AtomCore.Disposable
  private editorChanging: AtomCore.Disposable
  private activeEditorChanging: AtomCore.Disposable

  constructor() {
    this.navTree = null
    this.selectedNode = null
  }

  destroy(): void {
    if (this.editorScrolling) {
      this.editorScrolling.dispose()
    }
    if (this.editorChanging) {
      this.editorChanging.dispose()
    }
    if (this.activeEditorChanging) {
      this.activeEditorChanging.dispose()
    }
    this.navTree = null
    this.selectedNode = null
    if (this.root) {
      this.root.remove()
      this.root = null
    }
  }

  private setEditor(editor: AtomCore.IEditor) {
    this.editor = editor
  }

  private setNavTree(navTree: NavigationTree | null) {
    this.prepareNavTree(navTree as NavigationTreeExt)
    this.navTree = navTree
    this._render()
  }

  public forceUpdate() {
    this._render()
  }

  private async loadNavTree(filePath?: string) {
    filePath = filePath ? filePath : this.editor.getPath()
    // const client = await clientResolver.get(filePath);
    try {
      const client = await clientResolver.get(filePath)
      await client.executeOpen({file: filePath})
      const navtreeResult = await client.executeNavTree({file: filePath as string})
      const navTree = navtreeResult ? navtreeResult.body as NavigationTree : void 0
      if (navTree) {
        this.setNavTree(navTree)
      }
    } catch (err) {
      console.error(err, filePath)
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
    let modifiersClasses = this.getClassForKindModifiers(navTree.kindModifiers)
    if (modifiersClasses) {
      navTree.styleClasses += " " + modifiersClasses
    }

    if (navTree.childItems) {
      if (navTree.childItems.length < 1) {
        //normalize: remove empty lists
        navTree.childItems = void 0
        return
      }

      //TODO should there be a different sort-order?
      //     for now: sort ascending by line-number
      navTree.childItems.sort((a, b) => this.getNodeStartLine(a) - this.getNodeStartLine(b))

      for (let child of navTree.childItems) {
        this.prepareNavTree(child)
      }
    }
  }

  //TODO refactor/rename this function if/when React is abandoned
  componentDidMount() {
    // We listen to a few things

    let subscribeToEditor = (editor: AtomCore.IEditor) => {
      this.setEditor(editor)

      //set navTree
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
        //set navTree
        const filePath = editor.getPath()
        this.loadNavTree(filePath)
      })
    }

    let unsubscribeFromEditor = () => {
      //dispose subscriptions (except for editor-changing)
      if (this.editorScrolling) {
        this.editorScrolling.dispose()
      }
      if (this.editorChanging) {
        this.editorChanging.dispose()
      }

      //clear view:
      this.navTree = null
      this.forceUpdate()
    }

    // We don't start unless there is work to do ... so work
    subscribeToEditor(atomUtils.getActiveEditor())

    // Editor changing
    this.activeEditorChanging = (atom.workspace as IWorkspaceExt).onDidChangeActiveTextEditor(
      (editor: AtomCore.IEditor) => {
        if (atomUtils.onDiskAndTs(editor)) {
          subscribeToEditor(editor)
        } else {
          unsubscribeFromEditor()
        }
      },
    )
  }

  /**
   * Actually component will never unmount ... so no unsubs for now
   */
  componentWillUnmount() {} //see destroy()

  whileRendering: {lastCursorLine: number | null} = {
    lastCursorLine: 0,
  }

  _render(node?: HTMLElement): void {
    this.root = node ? node : this.root
    if (!this.root) {
      console.error("cannot render: not initialized yet.")
      return ////////////// EARLY EXIT /////////////////
    }
    this.whileRendering = {
      lastCursorLine: this.editor && this.editor.getLastCursor()
        ? this.editor.getLastCursor().getBufferRow()
        : null,
    }
    this.selectedNode = null
    if (!this.navTree) {
      if (this.navTree === null) {
        let child = this.root.firstChild
        if (child) this.root.removeChild(child)
      }
      return ////////////// EARLY EXIT /////////////////
    }
    let content = (
      <ol className="list-tree has-collapsable-children focusable-panel">
        {this.renderNode(this.navTree, 0)}
      </ol>
    )
    let child = this.root.firstChild
    if (child) this.root.replaceChild(content, child)
    else this.root.appendChild(content)

    if (this.selectedNode) this.scrollTo(this.selectedNode)
  }

  private getNodeStartLine(node: NavigationTree): number {
    return node.spans[0].start.line - 1
  }

  private getNodeEndLine(node: NavigationTree): number {
    let s = node.spans
    return s[s.length - 1].end.line - 1
  }

  private renderNode(node: NavigationTree, indent: number): HTMLElement {
    let selected = this.isSelected(node)

    let domNode = (
      <li className={"node entry exanded list-" + (node.childItems ? "nested-" : "") + "item"}>
        <div className="header list-item" onClick={event => this.entryClicked(event, node)}>
          <span className={(node as NavigationTreeExt).styleClasses}>
            {node.text}
          </span>
        </div>
        <ol className="entries list-tree">
          {node.childItems ? node.childItems.map(sn => this.renderNode(sn, indent + 1)) : ""}
        </ol>
      </li>
    )
    domNode.dataset.start = this.getNodeStartLine(node) + ""
    domNode.dataset.end = this.getNodeEndLine(node) + ""

    //set selected
    this.setSelected(domNode, selected)

    return domNode
  }

  private entryClicked(event: MouseEvent, node: NavigationTree): void {
    let target = (event.target as ElementExt).closest(".node")
    let isToggle: boolean = false
    //HACK detect click on collapse-/expand-icon: "collapse/expand icon" is 12px wide + 5px margin,
    //     so if <= 15 interpret as "clicked on collapse/expand icon"
    //     (cannot directly register/detect click on icons, since inserted via ::before style)
    if (target) {
      //FIX if not selected, there is an additional offset of ca. 34px
      let isSelected = target.classList.contains("selected")
      isToggle = event.layerX <= (isSelected ? 15 : 49)
    }
    // console.log(isToggle ? "click-toggle" : "click-scroll")

    if (!isToggle) {
      this.gotoNode(node)
    } else if (target) {
      let isCollapsed = target.classList.contains("collapsed")
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

  private getIconForKind(kind: string): string {
    return `icon icon-${kind}`
  }

  private getClassForKindModifiers(kindModifiers: string): string {
    if (!kindModifiers) {
      return ""
    } else if (kindModifiers.indexOf(" ") === -1) {
      return `modifier-${kindModifiers}`
    } else {
      return kindModifiers.split(" ").map(modifier => "modifier-" + modifier).join(" ")
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
  private isSelected(node: NavigationTree): boolean {
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
        //do not select, if there is a node selected "further down"
        if (!forceSelection && this.isChild(this.selectedNode, domNode)) {
          setSelected = false
        }
      }

      if (setSelected) {
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
      lastCursorLine: this.editor && this.editor.getLastCursor()
        ? this.editor.getLastCursor().getBufferRow()
        : null,
    }

    let cursorLine = this.whileRendering.lastCursorLine
    if (!cursorLine || !this.navTree || !this.root) {
      return
    }

    let selectedChild = this.findNodeAtCursorLine(this.root, cursorLine)
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
      let elem = domNode.children[i] as HTMLElement
      let selectedChild: HTMLElement | null = null
      if (elem.dataset) {
        let start: number = parseInt(elem.dataset.start as string, 10)
        let end: number = parseInt(elem.dataset.end as string, 10)
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
      let start: number = parseInt(domNode.dataset.start as string, 10)
      let end: number = parseInt(domNode.dataset.end as string, 10)
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
    let elem: any = domNode
    if (typeof elem.scrollIntoViewIfNeeded === "function") {
      elem.scrollIntoViewIfNeeded()
    } else if (typeof elem.scrollIntoView === "function") {
      elem.scrollIntoView()
    } //TODO else: impl. scroll
  }

  /**
   * HELPER scroll the current editor so that the node's representation becomes
   *        visible
   *        (i.e. scroll the text/typescript editor)
   * @param  {NavigationTree} node
   *              the node which's element should be made visible in the editor
   */
  gotoNode(node: NavigationTree): void {
    var gotoLine = this.getNodeStartLine(node)
    this.editor.setCursorBufferPosition([gotoLine, 0])
  }
}

export interface SemanticViewOptions {}

export class SemanticView {
  public get rootDomElement() {
    return this.element
  }
  public element: HTMLElement
  private comp: SemanticViewRenderer | null

  constructor(public config: SemanticViewOptions) {
    // super(config)
    this.element = document.createElement("div")
    this.element.classList.add("atomts", "atomts-semantic-view", "native-key-bindings")
  }

  /**
   * This function exists because the react component needs access to `panel` which needs access to `SemanticView`.
   * So we lazily create react component after panel creation
   */
  started = false
  start() {
    if (this.started && this.comp) {
      this.comp.forceUpdate()
      return
    }
    this.started = true
    this.comp = new SemanticViewRenderer()
    this.comp.componentDidMount()
    this.comp._render(this.rootDomElement)
  }

  getElement() {
    return this.rootDomElement
  }

  getTitle() {
    return "TypeScript"
  }

  getURI() {
    return "atom://" + VIEW_URI
  }
  // Tear down any state and detach
  destroy() {
    if (this.comp) {
      this.comp.destroy()
      this.comp = null
    }
    this.element.remove()
  }

  getDefaultLocation() {
    return "right"
  }

  getAllowedLocations() {
    // The locations into which the item can be moved.
    return ["left", "right"]
  }

  //TODO activate serialization/deserialization
  // add to package.json:
  // "deserializers": {
  //   "atomts-semantic-view/SemanticView": "deserializeSemanticView"
  // },
  //
  // serialize() {
  //   return {
  //     // This is used to look up the deserializer function. It can be any string, but it needs to be
  //     // unique across all packages!
  //     deserializer: "atomts-semantic-view/SemanticView",
  //     data: {},
  //   }
  // }
  //
  // static deserializeSemanticView(serialized: any) {
  //   //TODO should store & restore the expansion-state of the nodes
  //   return new SemanticView(serialized)
  // }
}

export class SemanticViewPane {
  subscriptions: CompositeDisposable | null = null

  activate(state: any) {
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(
      atom.workspace.addOpener((uri: string) => {
        if (uri === "atom://" + VIEW_URI) {
          const view = new SemanticView({})
          view.start()
          return view
        }
      }),
    )

    this.subscriptions.add({
      dispose: function() {
        ;(atom.workspace as IWorkspaceExt).getPaneItems().forEach(paneItem => {
          if (paneItem instanceof SemanticView) {
            paneItem.destroy()
          }
        })
      },
    })
  }

  deactivate() {
    if (this.subscriptions !== null) {
      this.subscriptions.dispose()
    }
  }

  toggle() {
    // console.log("TypeScript Semantic View was toggled!")
    ;(atom.workspace as IWorkspaceExt).toggle("atom://" + VIEW_URI)
  }

  show() {
    // console.log("TypeScript Semantic View was opened!")
    atom.workspace.open("atom://" + VIEW_URI, {})
  }

  hide() {
    // console.log("TypeScript Semantic View was hidden!")
    ;(atom.workspace as IWorkspaceExt).hide("atom://" + VIEW_URI)
  }
}

export var mainPane: SemanticViewPane
export function attach(): {dispose(): void; semanticView: SemanticViewPane} {
  // Only attach once
  if (!mainPane) {
    mainPane = new SemanticViewPane()
    mainPane.activate({})
  }

  return {
    dispose() {
      mainPane.deactivate()
    },
    semanticView: mainPane,
  }
}

export function toggle() {
  if (mainPane) {
    mainPane.toggle()
  } else {
    console.log(`cannot toggle: ${VIEW_URI} not initialized`)
  }
}
