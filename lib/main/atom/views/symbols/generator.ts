import {Tag} from "./symbolsTag"
import {NavigationTree, NavtoItem} from "typescript/lib/protocol"
import {Deps} from "./deps"

export async function generateFile(filePath: string, deps: Deps) {
  const navtree = await getNavTree(filePath, deps)
  if (navtree && navtree.childItems) {
    // NOTE omit root NavigationTree tree element (which corresponds to the file itself)
    return Array.from(parseNavTree(navtree.childItems))
  } else return []
}

export async function generateProject(filePath: string, search: string, deps: Deps) {
  const navtree = await getNavTo(filePath, search, deps)
  if (navtree) {
    return Array.from(parseNavTo(navtree))
  } else return []
}

function* parseNavTree(navTree: NavigationTree[], parent?: Tag): IterableIterator<Tag> {
  navTree.sort((a, b) => a.spans[0].start.line - b.spans[0].start.line)
  for (const item of navTree) {
    const tag = Tag.fromNavTree(item, parent)
    yield tag
    if (item.childItems) yield* parseNavTree(item.childItems, tag)
  }
}

function* parseNavTo(navTree: NavtoItem[], parent?: Tag) {
  for (const item of navTree) {
    yield Tag.fromNavto(item, parent)
  }
}

async function getNavTree(filePath: string, deps: Deps) {
  return deps.withTypescriptBuffer(filePath, buffer => {
    return buffer.getNavTree()
  })
}

async function getNavTo(filePath: string, search: string, deps: Deps) {
  return deps.withTypescriptBuffer(filePath, buffer => {
    return buffer.getNavTo(search)
  })
}
