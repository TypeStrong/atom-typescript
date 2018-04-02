import {NavigationTree} from "typescript/lib/protocol"

/**
 * interface for attaching some view-/representation-related fields
 * to the NavigationTree.
 */
export interface NavigationTreeViewModel extends NavigationTree {
  childItems?: NavigationTreeViewModel[]
  /**
   * indicates if a node (whith children) should be rendered
   * expanded or collapsed.
   * @default undefined (i.e. expanded)
   */
  collapsed: boolean | undefined
}

export interface ToNodeScrollableEditor {
  /**
   * Scroll the editor to line/column that corresponds to the starting-position
   * of the node.
   *
   * @param {NavigationTree} node the NavigationTree node to which to scroll the editor
   */
  gotoNode(node: NavigationTree): void
}

export interface SelectableNode {
  getSelectedNode(): NavigationTreeViewModel | undefined
}
