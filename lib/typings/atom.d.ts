export {}
import {Disposable} from "atom"
declare module "atom/dependencies/text-buffer/src/text-buffer" {
  interface TextBuffer {
    emitDidStopChangingEvent(): void
    getLanguageMode(): {
      readonly fullyTokenized?: boolean
      readonly tree?: boolean
    }
  }
}
declare module "atom" {
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
  interface Grammar {
    fileTypes: string[]
  }
}
