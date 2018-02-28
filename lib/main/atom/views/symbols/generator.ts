import {sep} from "path"
import {Tag} from "./fileSymbolsTag"
import {NavigationTree} from "typescript/lib/protocol"
import {Deps} from "./deps"

export async function generate(filePath: string, allFiles: boolean, deps: Deps) {
  const client = await deps.clientResolver.get(filePath)
  let files
  if (allFiles) {
    const {body} = await client.executeProjectInfo({file: filePath, needFileNameList: true})
    files = new Set(body!.fileNames!)
    files.delete(body!.configFileName)
  } else {
    files = new Set([filePath])
  }
  const allTags = await Promise.all(
    Array.from(files).map(async file => {
      if (file.includes(`${sep}node_modules${sep}`)) return []
      const navtree = await getNavTree(file, deps)
      const tags: Tag[] = []
      if (navtree && navtree.childItems) {
        // NOTE omit root NavigationTree tree element (which corresponds to the file itself)
        parseNavTree(file, navtree.childItems, tags)
      }
      return tags
    }),
  )
  return ([] as Tag[]).concat(...allTags)
}

function parseNavTree(
  file: string,
  navTree: NavigationTree | NavigationTree[],
  list: Tag[],
  parent?: Tag | null,
) {
  let tag: Tag | null
  let children: NavigationTree[] | null
  if (!Array.isArray(navTree)) {
    tag = new Tag(file, navTree, parent)
    list.push(tag)
    children = navTree.childItems ? navTree.childItems : null
  } else {
    tag = null
    children = navTree
  }

  if (children) {
    // sort children by their line-position
    children.sort((a, b) => a.spans[0].start.line - b.spans[0].start.line)
    for (let i = 0, size = children.length; i < size; ++i) {
      parseNavTree(file, children[i], list, tag)
    }
  }
}

// TODO possibly factor out a single navTree generator
async function getNavTree(filePath: string, deps: Deps): Promise<NavigationTree | undefined> {
  return deps.withTypescriptBuffer(filePath, buffer => {
    return buffer.getNavTree()
  })
}
