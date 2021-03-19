import * as etch from "etch"
import {handlePromise} from "../../../../utils"
import {isToggleEntry} from "./navTreeUtils"
import {NavigationTreeViewModel, SelectableNode, ToNodeScrollableEditor} from "./semanticViewModel"

export interface Props extends JSX.Props {
  navTree: NavigationTreeViewModel
  ctrl: ToNodeScrollableEditor & SelectableNode
}

export class NavigationNodeComponent implements JSX.ElementClass {
  constructor(public props: Props) {
    etch.initialize(this)
  }

  public async update(props: Partial<Props>) {
    this.props = {...this.props, ...props}
    await etch.update(this)
  }

  public async destroy() {
    await etch.destroy(this)
  }

  public render(): JSX.Element {
    const node = this.props.navTree
    const {ctrl} = this.props
    const classes =
      (node.childItems ? "nested-" : "") + "item" + (node.collapsed ? " collapsed" : " expanded")
    const styleClasses = this.getStyles()

    return (
      <li
        className={"node entry exanded list-" + classes}
        dataset={{
          startLine: this.props.navTree.spans[0]?.start?.line,
          endLine: this.props.navTree.spans[0]?.end?.line,
        }}>
        <div className={`header list-item`} on={{click: (event) => this.entryClicked(event, node)}}>
          <span className={styleClasses}>{node.text}</span>
        </div>
        <ol className="entries list-tree">
          {node.childItems
            ? node.childItems.map((sn) => <NavigationNodeComponent navTree={sn} ctrl={ctrl} />)
            : null}
        </ol>
      </li>
    )
  }

  private getStyles(): string {
    const {kind} = this.props.navTree
    let styles = `icon icon-${kind}`
    const {kindModifiers} = this.props.navTree
    if (kindModifiers) {
      styles +=
        " " +
        kindModifiers
          .split(/[, ]/)
          .map((modifier) => `modifier-${modifier.trim()}`)
          .join(" ")
    }
    return styles
  }

  private entryClicked(event: MouseEvent, node: NavigationTreeViewModel): void {
    event.stopPropagation()

    const isToggle: boolean = isToggleEntry(node, event)
    if (!isToggle) {
      this.props.ctrl.gotoNode(node)
    } else {
      node.collapsed = !node.collapsed
      handlePromise(etch.update(this))
    }
  }
}
