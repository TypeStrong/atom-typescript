import {NavigationTree, NavtoItem} from "typescript/lib/protocol"
import {Deps} from "./deps"
import {Tag} from "./symbolsTag"

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
  try {
    const client = await deps.getClient(filePath)
    const navtreeResult = await client.execute("navtree", {file: filePath})
    return navtreeResult.body
  } catch (e) {
    console.error(filePath, e)
  }
}

async function getNavTo(filePath: string, search: string, deps: Deps) {
  try {
    const client = await deps.getClient(filePath)
    const navtoResult = await client.execute("navto", {
      file: filePath,
      currentFileOnly: false,
      searchValue: search,
      maxResultCount: 1000,
    })
    return navtoResult.body
  } catch (e) {
    console.error(filePath, e)
  }
}
