import {NavigationTree, NavtoItem} from "typescript/lib/protocol"

export class Tag {
  public static fromNavTree(navTree: NavigationTree, parent?: Tag | null) {
    const start = navTree.spans[0].start
    return new Tag({
      name: navTree.text,
      type: navTree.kind,
      position: {row: start.line - 1, column: start.offset - 1},
      parent: parent != null ? parent : null,
    })
  }

  public static fromNavto(navTo: NavtoItem, parent?: Tag | null) {
    const start = navTo.start
    return new Tag({
      name: navTo.name,
      type: navTo.kind,
      position: {row: start.line - 1, column: start.offset - 1},
      parent: parent != null ? parent : null,
      file: navTo.file,
    })
  }

  public position: {row: number; column: number}
  public name: string
  public type: string
  public parent: Tag | null
  public file?: string

  private constructor(props: {
    position: {row: number; column: number}
    name: string
    type: string
    parent: Tag | null
    file?: string
  }) {
    this.position = props.position
    this.name = props.name
    this.type = props.type
    this.parent = props.parent
    this.file = props.file
  }
}
