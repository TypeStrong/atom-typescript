import {NavigationTree} from "typescript/lib/protocol"

export class Tag {
  public position: {row: number; column: number}
  public name: string
  public type: string
  public parent: Tag | null

  constructor(public file: string, navTree: NavigationTree, parent?: Tag | null) {
    this.name = navTree.text
    this.type = this.getType(navTree.kind)

    const start = navTree.spans[0].start
    this.position = {row: start.line - 1, column: start.offset}
    this.parent = parent ? parent : null
  }

  public getType(kind: string): string {
    return kind
  }
}
