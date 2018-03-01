import SelectListView = require("atom-select-list")
import {Panel} from "atom"
import * as etch from "etch"

export interface SelectListViewOptions<T> {
  items: T[] | Promise<T[]> | ((filterText: string) => T[]) | ((filterText: string) => Promise<T[]>)
  itemTemplate: (item: T, context: SelectListView<T>) => JSX.Element
  itemFilterKey: keyof T
  didChangeSelection?: (item: T) => void
  itemsClassList?: string[]
}

export async function selectListView<T>({
  items,
  itemTemplate,
  itemFilterKey,
  didChangeSelection,
  itemsClassList,
}: SelectListViewOptions<T>): Promise<T | undefined> {
  let panel: Panel<SelectListView<T>> | undefined
  const currentFocus = document.activeElement as HTMLElement
  try {
    return await new Promise<T | undefined>(resolve => {
      let didChangeQuery
      let loadingMessage: string | undefined = "Loading..."
      let emptyMessage
      if (typeof items === "function") {
        didChangeQuery = async (query: string) => {
          const timeout = setTimeout(() => select.update({loadingMessage: "Loading..."}), 300)
          const is = await items(query)
          clearTimeout(timeout)
          select.update({
            items: is,
            emptyMessage: "Nothing matches the search value",
            loadingMessage: undefined,
          })
        }
        loadingMessage = undefined
        emptyMessage = "Please enter a search value"
      }
      const select: SelectListView<T> = new SelectListView({
        items: [] as T[],
        elementForItem: (item: T) =>
          etch.render(<li>{itemTemplate(item, select)}</li>) as HTMLElement,
        filterKeyForItem: (item: T) => `${item[itemFilterKey]}`,
        didChangeSelection,
        didCancelSelection: () => {
          resolve()
        },
        didConfirmSelection: (item: T) => {
          resolve(item)
        },
        loadingMessage,
        didChangeQuery,
        emptyMessage,
        itemsClassList,
      })
      if (typeof items !== "function") {
        Promise.resolve(items).then(is => {
          select.update({items: is, loadingMessage: undefined})
        })
      }
      panel = atom.workspace.addModalPanel({
        item: select,
        visible: true,
      })
      select.focus()
    })
  } finally {
    if (panel) panel.destroy()
    if (currentFocus) currentFocus.focus()
  }
}
