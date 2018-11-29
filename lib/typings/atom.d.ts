export {}
declare module "atom" {
  interface TextBuffer {
    emitDidStopChangingEvent(): void
    getLanguageMode(): {readonly fullyTokenized: boolean}
  }
  interface TextEditor {
    onDidTokenize(callback: () => void): Disposable
    isDestroyed(): boolean
  }
  interface TextEditorElement {
    setUpdatedSynchronously(val: boolean): void
  }
}
