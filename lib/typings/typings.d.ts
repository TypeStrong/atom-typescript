interface Window {
  atom_typescript_debug: boolean
}

// experimental properties / methods on Element
// (do not use without checking existence of property/method first)
interface ElementExp extends Element {
  // experimental feature in Chrome, see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoViewIfNeeded
  scrollIntoViewIfNeeded?: (optCenter?: boolean) => void
}

interface CallableFunction {
  bind<T>(this: T, thisArg: any): T
}

namespace NodeJS {
  interface Process {
    activateUvLoop: () => void
  }
}

interface ObjectConstructor {
  keys<T>(o: T): Array<keyof T>
}
