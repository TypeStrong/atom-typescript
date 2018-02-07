import {NavigationTree, NavtoItem} from "typescript/lib/protocol"
import {parsePath} from "../../utils/fs"

/**
 * this is a modified extraction (of Tag class) from symbols-view/lib/file-view.js
 * for support of searching file-symbols in typescript files,
 * utilizing the typescript service instead of ctag.
 */

export class Tag {
  position: {row: number; column: number}
  name: string
  type: string
  parent: Tag | null
  directory?: string
  file?: string

  constructor(navItem: NavigationTree | NavtoItem, parent?: Tag | null) {
    if ((navItem as NavigationTree).text) {
      this.fromNavTree(navItem as NavigationTree, parent)
    } else if ((navItem as NavtoItem).name) {
      this.fromNavto(navItem as NavtoItem, parent)
    } else {
      console.error("Cannot convert to Tag: unkown data ", navItem)
    }
  }

  getType(kind: string): string {
    // TODO need to convert from ctag, but since this seem to be unused anyway...
    // switch(kind){
    //   case 'class':
    //   case 'struct':
    //   case 'interface':
    //   case 'enum':
    //   case 'typedef':
    //   case 'macro':
    //   case 'union':
    //   case 'module':
    //   case 'namespace':
    //     return 'class';
    //   case 'type':
    //   case 'variable':
    //   case 'field':
    //   case 'member':
    //   case 'var':
    //   case 'property':
    //   case 'alias':
    //   case 'let':
    //     return 'variable';
    //   case 'const':
    //     return 'const';
    //   case 'function':
    //   case 'constructor':
    //   case 'method':
    //   case 'setter':
    //   case 'getter':
    //     return 'function';
    // }
    return kind
  }

  private fromNavTree(navTree: NavigationTree, parent?: Tag | null) {
    this.name = navTree.text
    this.type = this.getType(navTree.kind)

    const start = navTree.spans[0].start
    this.position = {row: start.line - 1, column: start.offset}
    this.parent = parent ? parent : null
  }

  private fromNavto(navTo: NavtoItem, parent?: Tag | null) {
    this.name = navTo.name
    this.type = this.getType(navTo.kind)

    const start = navTo.start
    this.position = {row: start.line - 1, column: start.offset}
    this.parent = parent ? parent : null

    const path = parsePath(navTo.file)
    if (path && path.base) {
      this.file = path.base
      this.directory = path.dir
    }
  }
}
