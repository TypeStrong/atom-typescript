import * as etch from "etch"
import {isEqual} from "lodash"
import {Props, NavigationTreeViewModel} from "./semanticViewModel"
import {isSelected} from "./navTreeUtils"

export class NavigationNodeComponent implements JSX.ElementClass {
  constructor(public props: Props) {
    this.updateStyles(props.navTree)
    etch.initialize(this)
  }

  private updateStyles(navTree: NavigationTreeViewModel | null) {
    if (navTree) {
      navTree.styleClasses = this.getIconForKind(navTree.kind)
      const modifiersClasses = this.getClassForKindModifiers(navTree.kindModifiers)
      if (modifiersClasses) {
        navTree.styleClasses += " " + modifiersClasses
      }
    }
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

  public async update(props: Partial<Props>) {
    this.props = {...this.props, ...props}
    if (props.navTree) {
      this.updateStyles(props.navTree)
    }
    await etch.update(this)
  }

  public async destroy() {
    this.props.root = undefined
    await etch.destroy(this)
  }

  render() {
    return this.renderNode(this.props.navTree)
  }

  private renderNode(node: NavigationTreeViewModel | null): JSX.Element {
    if (node === null) return <div />

    const _pos = this.props.pos
    if (!_pos) return <div />

    const selected =
      (_pos.selectedNode && this.isSameNode(node, _pos.selectedNode)) ||
      (!_pos.selectedNode && isSelected(node, _pos))

    if (selected) {
      // console.log("selecting node ", node) // DEBUG
      _pos.selectedNode = node
    }

    const classes =
      (node.childItems ? "nested-" : "") +
      "item" +
      (node.collapsed ? " collapsed" : " expanded") +
      (selected ? " selected" : "")

    return (
      <li className={"node entry exanded list-" + classes}>
        <div className="header list-item" on={{click: event => this.entryClicked(event, node)}}>
          <span className={node.styleClasses}>{node.text || ""}</span>
        </div>
        <ol className="entries list-tree">
          {node.childItems
            ? node.childItems.map(sn => (
                <NavigationNodeComponent navTree={sn} root={this.props.root} pos={_pos} />
              ))
            : null}
        </ol>
      </li>
    )
  }

  private isSameNode(n1: NavigationTreeViewModel, n2: NavigationTreeViewModel): boolean {
    return n1.text === n2.text && isEqual(n1.spans, n2.spans)
  }

  private entryClicked(event: MouseEvent, node: NavigationTreeViewModel): void {
    event.stopPropagation()

    const isToggle: boolean = this.isToggleEntry(node, event)
    if (!isToggle && this.props.root) {
      this.props.root.gotoNode(node)
    } else {
      this.toggleNode(node)
      etch.update(this)
    }
  }

  private toggleNode(node: NavigationTreeViewModel) {
    node.collapsed = !node.collapsed
  }

  /**
   * HACK workaround for detecting click on collapse-/expand-icon
   *      (cannot directly register/detect click on icons, since inserted via ::before style)
   *
   * @param {NavigationTreeViewModel} node
   *                        the corresponding NavTree node
   * @param {MouseEvent} event
   *                        the mouse event
   * @returns {Boolean} <code>true</code> if entry's expand/collapse state should be toggled for nodeEntry
   *                                      (instead of navigating to its position in the text editor)
   */
  private isToggleEntry(node: NavigationTreeViewModel, event: MouseEvent): boolean {
    return !!node.childItems && event.target === event.currentTarget
  }
}
