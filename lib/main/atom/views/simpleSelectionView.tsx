import SelectListView = require("atom-select-list")
import {Panel} from "atom"
import * as etch from "etch"

export interface SelectListViewOptions<T> {
  items: T[] | Promise<T[]> | ((filterText: string) => T[]) | ((filterText: string) => Promise<T[]>)
  itemTemplate: (item: T, context: SelectListView<T>) => JSX.Element
  itemFilterKey: keyof T
  didChangeSelection?: (item?: T) => void
}

export async function selectListView<T>({
  items,
  itemTemplate,
  itemFilterKey,
  didChangeSelection,
}: SelectListViewOptions<T>): Promise<T | undefined> {
  let panel: Panel<SelectListView<T>> | undefined
  const currentFocus = document.activeElement as HTMLElement | void
  try {
    return await new Promise<T | undefined>(resolve => {
      let didChangeQuery
      let loadingMessage: string | undefined = "Loading..."
      let emptyMessage
      let resolved = false
      const update = (props: object) => {
        if (resolved) return
        select.update(props)
      }
      if (typeof items === "function") {
        didChangeQuery = async (query: string) => {
          const timeout = setTimeout(() => update({loadingMessage: "Loading..."}), 300)
          const is = await items(query)
          clearTimeout(timeout)
          update({
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
        elementForItem: (item: T) => etch.render(itemTemplate(item, select)) as HTMLElement,
        filterKeyForItem: (item: T) => `${item[itemFilterKey]}`,
        didChangeSelection,
        didCancelSelection: () => {
          resolved = true
          resolve()
        },
        didConfirmSelection: (item: T) => {
          resolved = true
          resolve(item)
        },
        loadingMessage,
        didChangeQuery,
        emptyMessage,
        itemsClassList: ["atom-typescript"],
      })
      if (typeof items !== "function") {
        Promise.resolve(items).then(is => {
          update({items: is, loadingMessage: undefined})
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
