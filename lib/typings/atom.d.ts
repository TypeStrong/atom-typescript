export {}
declare module "atom" {
  interface TextBuffer {
    emitDidStopChangingEvent(): void
  }

  interface TextEditor {
    isDestroyed(): boolean
    getURI(): string
  }
}
