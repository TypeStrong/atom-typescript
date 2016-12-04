declare namespace AtomCore {
  interface IEditor {
    onDidChangeGrammar(callback: (grammar: IGrammar) => any): Disposable
  }
}

declare namespace TextBuffer {
  interface ITextBuffer {
    onDidChange(callback: Function): AtomCore.Disposable    
  }
}
