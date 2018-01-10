import {Disposable} from "atom"

export function listen<T extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  event: T,
  selector: string,
  callback: (event: HTMLElementEventMap[T]) => void,
): Disposable {
  const bound = (evt: Event) => {
    const sel = (evt.target as HTMLElement).closest(selector)
    if (sel && element.contains(sel)) {
      callback(evt)
    }
  }
  element.addEventListener(event, bound)
  return new Disposable(() => {
    element.removeEventListener(event, bound)
  })
}
