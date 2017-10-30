interface Window {
  atom_typescript_debug: boolean
}

// escape-html
declare module "escape-html" {
  function escape(html: string): string
  export = escape
}

declare module "atom-space-pen-views" {
  import * as sp from "space-pen"
  export class SelectListView {
    storeFocusedElement(): void
    focusFilterEditor(): void
    restoreFocus(): void
    setItems(items: any[]): void
  }
  export class ScrollView {}
  export class View extends sp.View {}
  export var $: JQueryStatic
}

declare namespace AtomCore {
  export interface IEditor {
    element: any
  }
}
