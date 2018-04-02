"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
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
function findNodeAt(startLine, endLine, node) {
    if (!node.childItems) {
        return undefined;
    }
    for (const elem of node.childItems) {
        const start = getNodeStartLine(elem);
        const end = getNodeEndLine(elem);
        if (isFinite(start) && isFinite(end)) {
            if (startLine >= start && endLine <= end) {
                const selected = findNodeAt(startLine, endLine, elem);
                if (selected) {
                    return selected;
                }
                else {
                    return elem;
                }
            }
            else if (isFinite(end) && endLine < end) {
                break;
            }
        }
        const selectedChild = findNodeAt(startLine, endLine, elem);
        if (selectedChild) {
            return selectedChild;
        }
    }
    const nstart = getNodeStartLine(node);
    const nend = getNodeEndLine(node);
    if (isFinite(nstart) && isFinite(nend) && startLine >= nstart && endLine <= nend) {
        return node;
    }
    return undefined;
}
exports.findNodeAt = findNodeAt;
/**
 * Get start line for NavTree node
 * @param  node the NavTre node
 * @return the start line for the NavTree node, or 0, if none could be determined
 */
function getNodeStartLine(node) {
    // console.log('getNodeStartLine.node -> ', node)
    return node.spans.length > 0 ? node.spans[0].start.line - 1 : 0;
}
exports.getNodeStartLine = getNodeStartLine;
/**
 * Get start column for NavTree node
 * @param  node the NavTre node
 * @return the start column for the NavTree node, or 0, if none could be determined
 */
function getNodeStartOffset(node) {
    // console.log('getNodeStartLine.node -> ', node)
    return node.spans.length > 0 ? node.spans[0].start.offset - 1 : 0;
}
exports.getNodeStartOffset = getNodeStartOffset;
/**
 * Get end line for NavTree node
 * @param  node the NavTre node
 * @return the end line for the NavTree node, or 0, if none could be determined
 */
function getNodeEndLine(node) {
    const s = node.spans;
    return s.length > 0 ? s[s.length - 1].end.line - 1 : 0;
}
exports.getNodeEndLine = getNodeEndLine;
/**
 * HELPER transfere collapsed state from old NavigationTreeViewModel to
 * new view model.
 *
 * @returns {boolean} TRUE, if newTree and oldTree matched title
 */
function restoreCollapsed(newTree, oldTree) {
    if (!newTree || !oldTree)
        return newTree === oldTree;
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
            newTree.collapsed = true;
        }
        if (newTree.childItems && oldTree.childItems) {
            let newChild;
            let oldChild;
            for (let i = 0, size = newTree.childItems.length; i < size; ++i) {
                newChild = newTree.childItems[i];
                oldChild = oldTree.childItems[i];
                // allow for one addition / deletion in the children
                // (i.e. check if there's a match in the previous/next position)
                if (!restoreCollapsed(newChild, oldChild)) {
                    // try, if a child was removed
                    oldChild = oldTree.childItems[i + 1];
                    if (!restoreCollapsed(newChild, oldChild)) {
                        // try, if a child was added
                        oldChild = oldTree.childItems[i - 1];
                        restoreCollapsed(newChild, oldChild);
                    }
                }
            }
        }
        return true;
    }
    return false;
}
exports.restoreCollapsed = restoreCollapsed;
/**
 * HELPER modify / prepare NavigationTree for rendering.
 *
 * E.g. sort childItems by their location, preprocess className-string
 *
 * @param {NavigationTreeViewModel} navTree
 *            the NavigationTree that will be prepared for rendering
 */
function prepareNavTree(navTree) {
    if (navTree === null)
        return;
    if (navTree.childItems) {
        if (navTree.childItems.length < 1) {
            // normalize: remove empty lists
            navTree.childItems = undefined;
            return;
        }
        // TODO should there be a different sort-order?
        //     for now: sort ascending by line-number
        navTree.childItems.sort((a, b) => getNodeStartLine(a) - getNodeStartLine(b));
        for (const child of navTree.childItems) {
            prepareNavTree(child);
        }
    }
}
exports.prepareNavTree = prepareNavTree;
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
function isSelected(node, pos) {
    if (getNodeStartLine(node) <= pos && getNodeEndLine(node) >= pos) {
        const start = getNodeStartLine(node);
        const end = getNodeEndLine(node);
        if (findNodeAt(start, end, node)) {
            // -> there is a node "further down" that should get selected
            return false;
        }
        return true;
    }
    return false;
}
exports.isSelected = isSelected;
/**
 * compare nodes base on their label & code-position
 * (i.e. ignoring modifiers, children etc)
 */
function isSameNode(n1, n2) {
    return n1.text === n2.text && lodash_1.isEqual(n1.spans, n2.spans);
}
exports.isSameNode = isSameNode;
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
function isToggleEntry(node, event) {
    return !!node.childItems && event.target === event.currentTarget;
}
exports.isToggleEntry = isToggleEntry;
//# sourceMappingURL=navTreeUtils.js.map