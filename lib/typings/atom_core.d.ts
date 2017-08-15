declare namespace AtomCore {
  interface IEditor {
    onDidChangeGrammar(callback: (grammar: IGrammar) => any): Disposable
    gutterWithName(name: string): Gutter | null
    scrollToBufferPosition(pos: IPoint, options?: {center: boolean}): void
  }
  interface IConfig {
    onDidChange(opt: string, callback: (val: {oldValue: any; newValue: any}) => void): Disposable
  }
  interface CommandEvent extends Event {
    abortKeyBinding(): any
  }
  interface Gutter {
    decorateMarker(marker, decorationParams)
    isVisible(): boolean
    hide()
    show()
  }
  interface IWorkspace {
    buildTextEditor(options: {}): IEditor
  }
}

declare namespace TextBuffer {
  interface ITextBuffer {
    onWillChange(callback: Function): AtomCore.Disposable
    onDidChange(callback: Function): AtomCore.Disposable
    onDidChangeText(callback: Function): AtomCore.Disposable
    onDidStopChanging(callback: Function): AtomCore.Disposable
    onDidConflict(callback: Function): AtomCore.Disposable
    onDidChangeModified(callback: Function): AtomCore.Disposable
    onDidUpdateMarkers(callback: Function): AtomCore.Disposable
    onDidCreateMarker(callback: Function): AtomCore.Disposable
    onDidChangePath(callback: Function): AtomCore.Disposable
    onDidChangeEncoding(callback: Function): AtomCore.Disposable
    onWillSave(callback: Function): AtomCore.Disposable
    onDidSave(callback: Function): AtomCore.Disposable
    onDidDelete(callback: Function): AtomCore.Disposable
    onWillReload(callback: Function): AtomCore.Disposable
    onDidReload(callback: Function): AtomCore.Disposable
    onDidDestroy(callback: Function): AtomCore.Disposable
    onWillThrowWatchError(callback: Function): AtomCore.Disposable
    emitDidStopChangingEvent()
    debouncedEmitDidStopChangingEvent()
  }
}
