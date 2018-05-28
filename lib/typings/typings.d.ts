interface Window {
  atom_typescript_debug: boolean
}

// escape-html
declare module "escape-html" {
  function escape(html: string): string
  export = escape
}

// experimental properties / methods on Element
// (do not use without checking existence of property/method first)
interface ElementExp extends Element {
  // experimental feature in Chrome, see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoViewIfNeeded
  scrollIntoViewIfNeeded?: (optCenter?: boolean) => void
}

interface Function {
  bind<T>(this: T, thisArg: any): T
}
