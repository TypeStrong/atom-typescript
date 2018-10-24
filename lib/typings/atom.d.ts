export {}
declare module "atom" {
  interface TextBuffer {
    emitDidStopChangingEvent(): void
  }

  interface TextEditor {
    onDidTokenize(callback: () => void): Disposable
  }
  interface TextEditorElement {
    setUpdatedSynchronously(val: boolean): void
  }
  interface TextBuffer {
    getLanguageMode(): {readonly fullyTokenized: boolean}
  }
}
