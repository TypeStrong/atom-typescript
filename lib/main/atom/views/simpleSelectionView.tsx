import SelectListView = require("atom-select-list")
import {Panel} from "atom"
import * as etch from "etch"

export interface SelectListViewOptions<T> {
  items: T[]

  itemTemplate: (item: T) => JSX.Element

  /** some property on item */
  itemFilterKey: keyof T | ((item: T) => string)
}

export async function selectListView<T>({
  items,
  itemTemplate,
  itemFilterKey,
}: SelectListViewOptions<T>): Promise<T | undefined> {
  const elementForItem = (item: T) => etch.render(<li>{itemTemplate(item)}</li>) as HTMLElement
  const filterKeyForItem = (item: T) => {
    if (typeof itemFilterKey === "function") {
      // @ts-ignore // TODO: Complain to MS
      return itemFilterKey(item)
    } else if (itemFilterKey) {
      return `${item[itemFilterKey]}`
    } else {
      return `${item}`
    }
  }
  const myitems = await Promise.resolve(items)
  let panel: Panel<SelectListView<T>> | undefined
  let res: T | undefined
  const currentFocus = document.activeElement as HTMLElement
  try {
    res = await new Promise<T | undefined>(resolve => {
      const select = new SelectListView({
        items: myitems,
        // infoMessage: heading,
        itemsClassList: ["atom-typescript"],
        elementForItem,
        filterKeyForItem,
        didCancelSelection: () => {
          resolve()
        },
        didConfirmSelection: (item: T) => {
          resolve(item)
        },
      })
      select.element.classList.add("ide-haskell")
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
  return res
}
