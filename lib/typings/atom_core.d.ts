declare namespace AtomCore {
  interface IEditor {
    onDidChangeGrammar(callback: (grammar: IGrammar) => any): Disposable
  }

  interface CommandEvent extends Event {
    abortKeyBinding(): any
  }
}

declare namespace TextBuffer {
  interface ITextBuffer {
    onDidChange(callback: Function): AtomCore.Disposable
    onDidReload(callback: Function): AtomCore.Disposable
    onDidSave(callback: Function): AtomCore.Disposable
  }
}
