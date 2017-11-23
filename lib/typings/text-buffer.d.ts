declare namespace TextBuffer {
  interface ScanCallbackArgs {
    match: RegExpExecArray
    matchText: string
    range: TextBuffer.IRange
    stop: () => void
    replace: (text: string) => void
  }
}
