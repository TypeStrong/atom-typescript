import {CompositeDisposable, DisplayMarker, TextEditor} from "atom"
import {debounce, DebouncedFunc} from "lodash"
import {DocumentHighlightsItem} from "typescript/lib/protocol"
import {GetClientFunction} from "../../../client"
import {handlePromise} from "../../../utils"
import {isTypescriptEditorWithPath, spanToRange} from "../utils"

export class OccurenceController {
  private readonly disposables = new CompositeDisposable()
  private occurrenceMarkers: DisplayMarker[] = []
  private disposed = false

  constructor(private getClient: GetClientFunction, private editor: TextEditor) {
    let debouncedUpdate: DebouncedFunc<() => void>
    let didChangeTimeout: number | undefined
    let changeDelay: number
    let shouldHighlight: boolean = false
    this.disposables.add(
      atom.config.observe("atom-typescript.occurrenceHighlightDebounceTimeout", (val) => {
        debouncedUpdate = debounce(() => {
          handlePromise(this.update())
        }, val)
        changeDelay = val * 3.5
      }),
      editor.onDidChangeCursorPosition(() => {
        if (didChangeTimeout === undefined) debouncedUpdate()
        else shouldHighlight = true
      }),
      editor.onDidChangePath(() => debouncedUpdate()),
      editor.onDidChangeGrammar(() => debouncedUpdate()),
      editor.onDidChange(() => {
        if (didChangeTimeout !== undefined) clearTimeout(didChangeTimeout)
        didChangeTimeout = window.setTimeout(() => {
          if (shouldHighlight) {
            debouncedUpdate()
            shouldHighlight = false
          }
          didChangeTimeout = undefined
        }, changeDelay)
      }),
    )
  }

  public dispose() {
    if (this.disposed) return
    this.disposed = true
    this.disposables.dispose()
    this.clearMarkers()
  }

  private clearMarkers() {
    for (const marker of this.occurrenceMarkers) {
      marker.destroy()
    }
    this.occurrenceMarkers = []
  }

  private async update() {
    if (this.disposed) return
    if (!isTypescriptEditorWithPath(this.editor)) {
      this.clearMarkers()
      return
    }
    const filePath = this.editor.getPath()
    if (filePath === undefined) return
    const client = await this.getClient(filePath)
    if (this.disposed) return

    const pos = this.editor.getLastCursor().getBufferPosition()

    try {
      const result = await client.execute("documentHighlights", {
        file: filePath,
        line: pos.row + 1,
        offset: pos.column + 1,
        filesToSearch: [filePath],
      })
      if (this.disposed) return

      const newOccurrenceMarkers = Array.from(this.getNewOccurrenceMarkers(result.body!))
      for (const m of this.occurrenceMarkers) {
        if (!newOccurrenceMarkers.includes(m)) m.destroy()
      }
      this.occurrenceMarkers = newOccurrenceMarkers
    } catch (e) {
      if (window.atom_typescript_debug) console.error(e)
    }
  }

  private *getNewOccurrenceMarkers(data: DocumentHighlightsItem[]) {
    for (const fileInfo of data) {
      if (fileInfo.file !== this.editor.getPath()) continue
      for (const span of fileInfo.highlightSpans) {
        const range = spanToRange(span)
        const oldMarker = this.occurrenceMarkers.find((m) => m.getBufferRange().isEqual(range))
        if (oldMarker) yield oldMarker
        else {
          const marker = this.editor.markBufferRange(range)
          this.editor.decorateMarker(marker, {
            type: "highlight",
            class: "atom-typescript-occurrence",
          })
          yield marker
        }
      }
    }
  }
}
