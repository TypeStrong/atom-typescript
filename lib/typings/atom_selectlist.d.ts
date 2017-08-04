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
