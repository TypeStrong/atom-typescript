import SelectListView = require("atom-select-list")
import {Panel} from "atom"
import * as etch from "etch"

export interface SelectListViewOptions<T> {
  items: T[] | Promise<T[]>
  itemTemplate: (item: T) => JSX.Element
  itemFilterKey: keyof T
  didChangeSelection?: (item: T) => void
}

export async function selectListView<T>({
  items,
  itemTemplate,
  itemFilterKey,
  didChangeSelection,
}: SelectListViewOptions<T>): Promise<T | undefined> {
  let panel: Panel<SelectListView<T>> | undefined
  const currentFocus = document.activeElement as HTMLElement
  try {
    return await new Promise<T | undefined>(resolve => {
      const select = new SelectListView({
        items: [] as T[],
        elementForItem: (item: T) => etch.render(<li>{itemTemplate(item)}</li>) as HTMLElement,
        filterKeyForItem: (item: T) => `${item[itemFilterKey]}`,
        didChangeSelection,
        didCancelSelection: () => {
          resolve()
        },
        didConfirmSelection: (item: T) => {
          resolve(item)
        },
        loadingMessage: "Loading...",
      })
      Promise.resolve(items).then(is => {
        select.update({items: is, loadingMessage: undefined})
      })
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
