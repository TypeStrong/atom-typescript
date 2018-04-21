declare module "atom-select-list" {
  export = SelectListView
}
declare class SelectListView<T> {
  public element: HTMLElement
  constructor(props: Props<T>)
  public focus(): void
  public update(props: Partial<IProps<T>>): Promise<void>
  public getFilterQuery(): string
}
declare interface Props<T> {
  /** an array containing the objects you want to show in the select list. */
  items: T[]
  /** a function that is called whenever an item needs to be displayed. */
  elementForItem: (item: T) => HTMLElement
  /** the number of maximum items that are shown. */
  maxResults?: number
  /** a function that allows to decide which items to show whenever the query changes.
   * By default, it uses fuzzaldrin to filter results.
   */
  filter?: (items: T[], query: string) => T[]
  /** when filter is not provided, this function will be called to retrieve a string
   * property on each item and that will be used to filter them.
   */
  filterKeyForItem?: (item: T) => string
  /** a function that allows to apply a transformation to the user query and whose
   * return value will be used to filter items.
   */
  filterQuery?: (query: string) => string
  /** a string that will replace the contents of the query editor. */
  query?: string
  /** a function that allows to change the order in which items are shown. */
  order?: (item1: T, item2: T) => number
  /** a string shown when the list is empty. */
  emptyMessage?: string
  /** a string that needs to be set when you want to notify the user that an error occurred. */
  errorMessage?: string
  /** a string that needs to be set when you want to provide some information to the user. */
  infoMessage?: string
  /** a string that needs to be set when you are loading items in the background. */
  loadingMessage?: string
  /**
   * a string or number that needs to be set when the progress status changes (e.g. a percentage
   * showing how many items have been loaded so far).
   */
  loadingBadge?: string | number
  /** an array of strings that will be added as class names to the items element. */
  itemsClassList?: string[]
  /** a function that is called when the query changes. */
  didChangeQuery?: (query: string) => void
  /** a function that is called when the selected item changes. */
  didChangeSelection?: (item?: T) => void
  /** a function that is called when the user clicks or presses enter on an item. */
  didConfirmSelection?: (item: T) => void
  /** a function that is called when the user presses Enter but the list is empty. */
  didConfirmEmptySelection?: () => void
  /** a function that is called when the user presses Esc or the list loses focus. */
  didCancelSelection?: () => void
}
