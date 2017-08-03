interface Window {
  atom_typescript_debug: boolean
}

// escape-html
declare module "escape-html" {
  function escape(html: string): string
  export = escape
}

declare module "atom-space-pen-views" {
  import atom = require("atom")
  export class SelectListView extends atom.SelectListView {}
  export class ScrollView extends atom.ScrollView {}
  export class View extends atom.View {}
  export var $: JQueryStatic
}

declare namespace AtomCore {
  export interface IEditor {
    element: any
  }
}

declare module "atom-select-list" {
  export = SelectListView

  declare class SelectListView {
    constructor(props)
    focus()
    didLoseFocus(event)
    reset()
    destroy()
    registerAtomCommands()
    update(props)
    render()
    renderItems()
    renderErrorMessage()
    renderInfoMessage()
    renderLoadingMessage()
    getQuery()
    getFilterQuery()
    didChangeQuery()
    didClickItem(itemIndex)
    computeItems(updateComponent)
    fuzzyFilter(items, query)
    getSelectedItem()
    selectPrevious()
    selectNext()
    selectFirst()
    selectLast()
    selectIndex(index, updateComponent)
    selectItem(item)
    confirmSelection()
    cancelSelection()
  }
}
declare module "fs-plus"
