export {}
import {Disposable} from "atom"
declare module "atom" {
  interface TextBuffer {
    emitDidStopChangingEvent(): void
    getLanguageMode(): {
      readonly fullyTokenized?: boolean
      readonly tree?: boolean
    }
  }
  interface TextEditor {
    onDidTokenize(callback: () => void): Disposable
    isDestroyed(): boolean
    component: {
      getNextUpdatePromise(): Promise<unknown>
    }
  }
  interface TextEditorElement {
    setUpdatedSynchronously(val: boolean): void
  }
}
