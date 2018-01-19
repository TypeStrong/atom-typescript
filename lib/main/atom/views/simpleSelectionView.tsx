import SelectListView = require("atom-select-list")
import {Panel} from "atom"
import * as etch from "etch"

export interface SelectListViewOptions<T> {
  items: T[]
  itemTemplate: (item: T) => JSX.Element
  itemFilterKey: keyof T
}

export async function selectListView<T>({
  items,
  itemTemplate,
  itemFilterKey,
}: SelectListViewOptions<T>): Promise<T | undefined> {
  let panel: Panel<SelectListView<T>> | undefined
  const currentFocus = document.activeElement as HTMLElement
  try {
    return await new Promise<T | undefined>(resolve => {
      const select = new SelectListView({
        items,
        elementForItem: (item: T) => etch.render(<li>{itemTemplate(item)}</li>) as HTMLElement,
        filterKeyForItem: (item: T) => `${item[itemFilterKey]}`,
        didCancelSelection: () => {
          resolve()
        },
        didConfirmSelection: (item: T) => {
          resolve(item)
        },
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
