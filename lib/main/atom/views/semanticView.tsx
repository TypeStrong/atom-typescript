import atomUtils = require("../utils")
import {CompositeDisposable} from "atom"
import * as sp from "atom-space-pen-views"
import * as view from "./view"
import {clientResolver} from "../../atomts"
import * as dom from "jsx-render-dom"
import {NavigationTree} from "typescript/lib/protocol"

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

  setEditor(editor: AtomCore.IEditor) {
    this.editor = editor
  }

  setNavTree(navTree: NavigationTree | null) {
    this.navTree = navTree
    this._render()
  }

  forceUpdate() {
    //FIXME should this be done differently?
    this._render()
  }

  async loadNavTree(filePath?: string) {
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

    // We don't start unless there is work to do ... so work
    subscribeToEditor(atomUtils.getActiveEditor())

    // Editor changing
    this.activeEditorChanging = (atom.workspace as IWorkspaceExt).onDidChangeActiveTextEditor(
      (editor: AtomCore.IEditor) => {
        if (atomUtils.onDiskAndTs(editor)) {
          subscribeToEditor(editor)
        }
        // console.log('active pane changed: ', editor);
      },
    )
  }

  /**
   * Actually component will never unmount ... so no unsubs for now
   */
  componentWillUnmount() {}

  whileRendering: {lastCursorLine: number | null} = {
    lastCursorLine: 0,
  }

  _render(node?: HTMLElement) {
    this.root = node ? node : this.root
    if (!this.root) {
      console.error("cannot render: not initialized yet.")
      return
    }
    this.whileRendering = {
      lastCursorLine: this.editor && this.editor.getLastCursor()
        ? this.editor.getLastCursor().getBufferRow()
        : null,
    }
    if (!this.navTree) {
      if (this.navTree === null) {
        let child = this.root.firstChild
        if (child) this.root.removeChild(child)
      }
      return ////////////// EARLY EXIT /////////////////
    }
    this.selectedNode = null
    let content = (
      <ol className="entries list-tree has-collapsable-children focusable-panel">
        {this.renderNode(this.navTree, 0)}
      </ol>
    )
    let child = this.root.firstChild
    if (child) this.root.replaceChild(content, child)
    else this.root.appendChild(content)

    if (this.selectedNode) this.scrollTo(this.selectedNode)
  }

  _nodeStartLine(node: NavigationTree) {
    return node.spans[0].start.line - 1
  }

  _nodeEndLine(node: NavigationTree) {
    let s = node.spans
    return s[s.length - 1].end.line - 1
  }

  renderNode(node: NavigationTree, indent: number): HTMLElement {
    let selected = this.isSelected(node)

    let domNode = (
      <li className={"node entry exanded list-" + (node.childItems ? "nested-" : "") + "item"}>
        <div className="header list-item" onClick={event => this.entryClicked(event, node)}>
          <span
            className={
              this.getIconForKind(node.kind) + this.getClassForKindModifiers(node.kindModifiers)
            }>
            {node.text}
          </span>
        </div>
        <ol className="entries list-tree">
          {node.childItems
            ? node.childItems
                .sort((a, b) => this._nodeStartLine(a) - this._nodeStartLine(b)) //TODO should there be a different sort-order? for now: just by line-number
                .map(sn => this.renderNode(sn, indent + 1))
            : ""}
        </ol>
      </li>
    )
    domNode.dataset.start = this._nodeStartLine(node) + ""
    domNode.dataset.end = this._nodeEndLine(node) + ""

    //set selected
    this.setSelected(domNode, selected)

    return domNode
  }

  entryClicked(event: MouseEvent, node: NavigationTree): void {
    //FIXME detect click on collapse icon: "collapse icon" is 12px wide + 5px margin,
    //      so if <= 15 interpret as "clicked on collapse icon"
    let isToggle: boolean = event.layerX <= 15
    console.log(isToggle ? "click-toggle" : ">>> click-scroll")

    if (!isToggle) {
      this.gotoNode(node)
    } else {
      let target = (event.target as any).closest(".node") as HTMLElement
      if (target) {
        let isCollapsed = target.classList.contains("collapsed")
        if (isCollapsed) {
          this.expandEntry(target)
        } else {
          this.collapseEntry(target)
        }
      }
    }
    event.stopPropagation()
  }

  collapseEntry(target: HTMLElement) {
    target.classList.add("collapsed")
    target.classList.remove("expanded")
  }

  expandEntry(target: HTMLElement) {
    target.classList.add("expanded")
    target.classList.remove("collapsed")
  }

  getIconForKind(kind: string) {
    return `icon icon-${kind}`
  }

  getClassForKindModifiers(kindModifiers: string): string {
    if (!kindModifiers) {
      return ""
    } else if (kindModifiers.indexOf(" ") === -1) {
      return ` modifier-${kindModifiers}`
    } else {
      return " " + kindModifiers.split(" ").map(modifier => "modifier-" + modifier).join(" ")
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
  isChild(childNode: HTMLElement, node: HTMLElement) {
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
  isSelected(node: NavigationTree): boolean {
    if (this.whileRendering.lastCursorLine == null) return false
    else {
      if (
        this._nodeStartLine(node) <= this.whileRendering.lastCursorLine &&
        this._nodeEndLine(node) >= this.whileRendering.lastCursorLine
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
  setSelected(domNode: HTMLElement, selected: boolean, forceSelection?: boolean) {
    if (selected) {
      let setSelected: boolean = true
      if (this.selectedNode) {
        //do not select, if there is a node selected "further down"
        if (!forceSelection && this.isChild(this.selectedNode, domNode)) {
          setSelected = false
        }
      }

      if (setSelected) {
        let labelSpan: Element
        if (this.selectedNode) {
          labelSpan = /*this.selectedNode.firstElementChild ||*/ this.selectedNode
          labelSpan.classList.remove("selected")
        }

        labelSpan = /*domNode.firstElementChild ||*/ domNode
        labelSpan.classList.add("selected")
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
  findNodeAtCursorLine(domNode: HTMLElement, cursorLine: number): HTMLElement | null {
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
    var gotoLine = this._nodeStartLine(node)
    this.editor.setCursorBufferPosition([gotoLine, 0])
  }
}

export interface SemanticViewOptions {}

export class SemanticView extends view.ScrollView<SemanticViewOptions> {
  public mainContent: JQuery
  public get rootDomElement() {
    return this.mainContent[0]
  }
  private comp: SemanticViewRenderer | null
  static content() {
    return this.div({class: "atomts atomts-semantic-view native-key-bindings"}, () => {
      this.div({
        outlet: "mainContent",
        class: "layout vertical atomts atomts-semantic-view native-key-bindings",
      })
    })
  }

  constructor(public config: SemanticViewOptions) {
    super(config)
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
    return "atom://atomts-semantic-view"
  }
  // Tear down any state and detach
  destroy() {
    // this.element.remove();
    // this.subscriptions.dispose();
    //TODO
    if (this.comp) {
      this.comp.destroy()
      this.mainContent.remove()
      this.comp = null
      this.started = false
    }
  }

  getDefaultLocation() {
    return "right"
  }

  getAllowedLocations() {
    // The locations into which the item can be moved.
    return ["left", "right"]
  }

  serialize() {
    return {
      // This is used to look up the deserializer function. It can be any string, but it needs to be
      // unique across all packages!
      deserializer: "atomts-semantic-view/SemanticView",
    }
  }

  deserializeSemanticView(serialized: any) {
    //TODO should store & restore the expansion-state of the nodes
    return new SemanticView({})
  }
}

interface IWorkspaceExt extends AtomCore.IWorkspace {
  getPaneItems(): Array<AtomCore.IPane>
  toggle(item: AtomCore.IPane | string): Promise<void>
  hide(item: AtomCore.IPane | string): boolean

  onDidChangeActiveTextEditor(editor: any): AtomCore.Disposable
}

export class SemanticViewPane {

  subscriptions: CompositeDisposable | null = null

  activate(state: any) {
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(
      atom.workspace.addOpener((uri: string) => {
        if (uri === "atom://atomts-semantic-view") {
          const view = new SemanticView({})
          view.start() //FIXME
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
    console.log("TypeScript Semantic View was toggled!")
    ;(atom.workspace as IWorkspaceExt).toggle("atom://atomts-semantic-view")
  }

  show() {
    console.log("TypeScript Semantic View was opened!")
    atom.workspace.open("atom://atomts-semantic-view", {})
  }

  hide() {
    console.log("TypeScript Semantic View was hidden!")
    ;(atom.workspace as IWorkspaceExt).hide("atom://atomts-semantic-view")
  }
}

export var mainPane: SemanticViewPane
export function attach(): {dispose(): void; semanticView: SemanticViewPane} {
  // Only attach once
  if (mainPane) {
    return {
      dispose() {
        console.log("TODO: Detach the semantic view: ", mainPane)
      },
      semanticView: mainPane,
    }
  }

  mainPane = new SemanticViewPane()
  mainPane.activate({})

  return {
    dispose() {
      console.log("TODO: Detach the semantic view: ", mainPane)
    },
    semanticView: mainPane,
  }
}

export function toggle() {
  if (mainPane) {
    mainPane.toggle()
  } else {
    console.log("cannot toggle: atomts-semantic-view not initialized")
  }
}
