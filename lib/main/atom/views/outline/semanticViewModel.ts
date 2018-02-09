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
