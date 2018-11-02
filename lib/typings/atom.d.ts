export {}
declare module "atom" {
  interface TextBuffer {
    emitDidStopChangingEvent(): void
    getLanguageMode(): {readonly fullyTokenized: boolean}
  }
  interface TextEditor {
    onDidTokenize(callback: () => void): Disposable
  }
  interface TextEditorElement {
    setUpdatedSynchronously(val: boolean): void
  }
}
