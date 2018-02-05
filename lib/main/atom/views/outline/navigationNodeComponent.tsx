import * as etch from "etch"
import {isEqual} from "lodash"
import {Props, NavigationTreeViewModel} from "./semanticViewModel"

export class NavigationNodeComponent implements JSX.ElementClass {
  constructor(public props: Props) {
    etch.initialize(this)
  }

  public async update(props: Partial<Props>) {
    this.props = {...this.props, ...props}
    await etch.update(this)
  }

  public async destroy() {
    this.props.root = null
    await etch.destroy(this)
  }

  render() {
    return this.renderNode(this.props.navTree)
  }

  private renderNode(node: NavigationTreeViewModel | null): JSX.Element {
    if (node === null) return <div />

    const _root = this.props.root
    if (!_root) return <div />

    const selected =
      (_root.selectedNode && this.isSameNode(node, _root.selectedNode)) ||
      (!_root.selectedNode && _root.isSelected(node))

    if (selected) {
      // console.log("selecting node ", node) // DEBUG
      _root.selectedNode = node
    }

    const classes =
      (node.childItems ? "nested-" : "") +
      "item" +
      (node.collapsed ? " collapsed" : " expanded") +
      (selected ? " selected" : "")

    const domNode: JSX.Element = (
      <li className={"node entry exanded list-" + classes}>
        <div className="header list-item" on={{click: event => this.entryClicked(event, node)}}>
          <span className={node.styleClasses}>{node.text || ""}</span>
        </div>
        <ol className="entries list-tree">
          {node.childItems ? (
            node.childItems.map(sn => <NavigationNodeComponent {...{navTree: sn, root: _root}} />)
          ) : (
            <div />
          )}
        </ol>
      </li>
    )

    return domNode
  }

  private isSameNode(n1: NavigationTreeViewModel, n2: NavigationTreeViewModel): boolean {
    return n1.text === n2.text && isEqual(n1.spans, n2.spans)
  }

  private entryClicked(event: MouseEvent, node: NavigationTreeViewModel): void {
    event.stopPropagation()

    const target = (event.target as Element).closest(".node")
    const isToggle: boolean = this.isToggleEntry(target, event)

    if (!isToggle && this.props.root) {
      this.props.root.gotoNode(node)
    } else if (target) {
      this.toggleNode(node)
    }
    etch.update(this)
  }

  private toggleNode(node: NavigationTreeViewModel) {
    // console.log("toggle " + !!node.collapsed + " -> " + !node.collapsed + " ", node) // DEBUG
    node.collapsed = !node.collapsed
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
  private isToggleEntry(nodeEntry: Element | null, event: MouseEvent): boolean {
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
}
