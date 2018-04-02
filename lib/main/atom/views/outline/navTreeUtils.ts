import {NavigationTreeViewModel} from "./semanticViewModel"
import {NavigationTree} from "typescript/lib/protocol"
import {isEqual} from "lodash"

/**
 * HELPER find the node that is "furthest down" the
 *        node hiearchy, i.e. which's start-, end-position contains the
 *        cursorLine AND is smallest.
 * @param  {NavigationTreeViewModel} node
 *                  the HTML element from which to start searching
 * @param  {Number} cursorLine the cursor line
 * @return {HTMLElement|null} the node's HTML representation which matches cursorLine
 *                            (i.e. which' start-, end-position contain cursorLine while
 *                             having the smallest distance to cursorLine), or NULL if no
 *                            matching node can be found
 */
export function findNodeAt(
  startLine: number,
  endLine: number,
  node: NavigationTreeViewModel,
): NavigationTreeViewModel | undefined {
  if (!node.childItems) {
    return undefined
  }

  for (const elem of node.childItems) {
    const start: number = getNodeStartLine(elem)
    const end: number = getNodeEndLine(elem)
    if (isFinite(start) && isFinite(end)) {
      if (startLine >= start && endLine <= end) {
        const selected = findNodeAt(startLine, endLine, elem)
        if (selected) {
          return selected
        } else {
          return elem
        }
      } else if (isFinite(end) && endLine < end) {
        break
      }
    }

    const selectedChild = findNodeAt(startLine, endLine, elem)

    if (selectedChild) {
      return selectedChild
    }
  }

  const nstart: number = getNodeStartLine(node)
  const nend: number = getNodeEndLine(node)
  if (isFinite(nstart) && isFinite(nend) && startLine >= nstart && endLine <= nend) {
    return node
  }
  return undefined
}

/**
 * Get start line for NavTree node
 * @param  node the NavTre node
 * @return the start line for the NavTree node, or 0, if none could be determined
 */
export function getNodeStartLine(node: NavigationTree): number {
  // console.log('getNodeStartLine.node -> ', node)
  return node.spans.length > 0 ? node.spans[0].start.line - 1 : 0
}

/**
 * Get start column for NavTree node
 * @param  node the NavTre node
 * @return the start column for the NavTree node, or 0, if none could be determined
 */
export function getNodeStartOffset(node: NavigationTree): number {
  // console.log('getNodeStartLine.node -> ', node)
  return node.spans.length > 0 ? node.spans[0].start.offset - 1 : 0
}

/**
 * Get end line for NavTree node
 * @param  node the NavTre node
 * @return the end line for the NavTree node, or 0, if none could be determined
 */
export function getNodeEndLine(node: NavigationTree): number {
  const s = node.spans
  return s.length > 0 ? s[s.length - 1].end.line - 1 : 0
}

/**
 * HELPER transfere collapsed state from old NavigationTreeViewModel to
 * new view model.
 *
 * @returns {boolean} TRUE, if newTree and oldTree matched title
 */
export function restoreCollapsed(
  newTree: NavigationTreeViewModel | null,
  oldTree: NavigationTreeViewModel | null,
): boolean {
  if (!newTree || !oldTree) return newTree === oldTree

  // a bit of guess work here:
  // there may have been additions/deletions in the children
  // (in comparision to the previous navTree), so the tranfere of
  // the collapsed state really is a heuristical process.
  //
  // For now, we assume, if the name (i.e. node.text) is the same
  // then it refers to the same entity (i.e. it should get the same
  // collapsed state); which is not true in case a variable/function/etc
  // was renamed.
  // But we do not want the get too elaborate and do expensive modification-
  // detection here, so in case of renaming, we just reset the collapsed
  // state to the default (i.e. expanded).
  // Same for reordering etc. of children: for complex changes we just
  // revert to the default state.

  if (newTree.text === oldTree.text) {
    if (oldTree.collapsed) {
      newTree.collapsed = true
    }

    if (newTree.childItems && oldTree.childItems) {
      let newChild: NavigationTreeViewModel
      let oldChild: NavigationTreeViewModel
      for (let i = 0, size = newTree.childItems.length; i < size; ++i) {
        newChild = newTree.childItems[i]
        oldChild = oldTree.childItems[i]
        // allow for one addition / deletion in the children
        // (i.e. check if there's a match in the previous/next position)
        if (!restoreCollapsed(newChild, oldChild)) {
          // try, if a child was removed
          oldChild = oldTree.childItems[i + 1]
          if (!restoreCollapsed(newChild, oldChild)) {
            // try, if a child was added
            oldChild = oldTree.childItems[i - 1]
            restoreCollapsed(newChild, oldChild)
          }
        }
      }
    }
    return true
  }

  return false
}

/**
 * HELPER modify / prepare NavigationTree for rendering.
 *
 * E.g. sort childItems by their location, preprocess className-string
 *
 * @param {NavigationTreeViewModel} navTree
 *            the NavigationTree that will be prepared for rendering
 */
export function prepareNavTree(navTree: NavigationTreeViewModel | null): void {
  if (navTree === null) return

  if (navTree.childItems) {
    if (navTree.childItems.length < 1) {
      // normalize: remove empty lists
      navTree.childItems = undefined
      return
    }

    // TODO should there be a different sort-order?
    //     for now: sort ascending by line-number
    navTree.childItems.sort((a, b) => getNodeStartLine(a) - getNodeStartLine(b))

    for (const child of navTree.childItems) {
      prepareNavTree(child)
    }
  }
}

/**
 * HELPER test, if the HTMLElement for <code>node</code> should be displayed
 *        as "selected", by checking if the current cursor is within
 *        start-, end-line of the node.
 *
 * NOTE since a potential to-be-selected node may conatain other nodes,
 *      that also "should be selected", this functions checks, if there is a
 *      node "furthest down" in the hiearchy that could/should get selected.
 *
 * @param  {NavigationTreeViewModel} node
 *            the node to be tested
 * @param  {number} pos
 *            the cursor (line) position in the editor
 * @return {Boolean} true, if the node's HTML representation should be selected
 */
export function isSelected(node: NavigationTreeViewModel, pos: number): boolean {
  if (getNodeStartLine(node) <= pos && getNodeEndLine(node) >= pos) {
    const start: number = getNodeStartLine(node)
    const end: number = getNodeEndLine(node)
    if (findNodeAt(start, end, node)) {
      // -> there is a node "further down" that should get selected
      return false
    }
    return true
  }
  return false
}

/**
 * compare nodes base on their label & code-position
 * (i.e. ignoring modifiers, children etc)
 */
export function isSameNode(n1: NavigationTreeViewModel, n2: NavigationTreeViewModel): boolean {
  return n1.text === n2.text && isEqual(n1.spans, n2.spans)
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
export function isToggleEntry(node: NavigationTreeViewModel, event: MouseEvent): boolean {
  return !!node.childItems && event.target === event.currentTarget
}
