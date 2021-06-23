import {OutlineProvider, OutlineTree, OutlineTreeKind} from "atom-ide-base"
import {NavigationTree, ScriptElementKind} from "typescript/lib/protocol"
import {GetClientFunction} from "../../client"
import {spanToRange, typeScriptScopes} from "../atom/utils"

let outlineProviderPriority = 100
export function getOutlineProvider(getClient: GetClientFunction): OutlineProvider {
  return {
    name: "Atom-TypeScript",
    grammarScopes: typeScriptScopes(),
    priority: outlineProviderPriority++,
    updateOnEdit: true,
    async getOutline(editor) {
      const filePath = editor.getPath()
      if (filePath === undefined) return
      const client = await getClient(filePath)
      const navTreeResult = await client.execute("navtree", {file: filePath})
      const navTree = navTreeResult.body
      if (!navTree) return
      return {outlineTrees: [navTreeToOutline(navTree)]}
    },
  }
}

function navTreeToOutline(navTree: NavigationTree): OutlineTree {
  const ranges = navTree.spans.map(spanToRange)
  const range = ranges.reduce((prev, cur) => cur.union(prev))
  return {
    kind: kindMap[navTree.kind],
    plainText: navTree.text,
    startPosition: range.start,
    endPosition: range.end,
    landingPosition: navTree.nameSpan ? spanToRange(navTree.nameSpan).start : undefined,
    children: navTree.childItems ? navTree.childItems.map(navTreeToOutline).sort(compareNodes) : [],
  }
}

function compareNodes(a: OutlineTree, b: OutlineTree): number {
  const apos = a.landingPosition ? a.landingPosition : a.startPosition
  const bpos = b.landingPosition ? b.landingPosition : b.startPosition
  return apos.compare(bpos)
}

const kindMap: {[key in ScriptElementKind]: OutlineTreeKind | undefined} = {
  // | "file"
  directory: "file",
  // | "module"
  module: "module",
  "external module name": "module",
  // | "namespace"
  // | "package"
  // | "class"
  class: "class",
  "local class": "class",
  // | "method"
  method: "method",
  // | "property"
  property: "property",
  getter: "property",
  setter: "property",
  // | "field"
  "JSX attribute": "field",
  // | "constructor"
  constructor: "constructor",
  // | "enum"
  enum: "enum",
  // | "interface"
  interface: "interface",
  type: "interface",
  // | "function"
  function: "function",
  "local function": "function",
  // | "variable"
  label: "variable",
  alias: "variable",
  var: "variable",
  let: "variable",
  "local var": "variable",
  parameter: "variable",
  // | "constant"
  "enum member": "constant",
  const: "constant",
  // | "string"
  string: "string",
  // | "number"
  // | "boolean"
  // | "array"
  // ???
  "": undefined,
  warning: undefined,
  keyword: undefined,
  script: undefined,
  call: undefined,
  index: undefined,
  construct: undefined,
  "type parameter": undefined,
  "primitive type": undefined,
}
