import {$} from "atom-space-pen-views"
import {CompositeDisposable} from "atom"
import {clientResolver} from "./atomts"
import {spanToRange} from "./utils/tsUtil"
import {TypescriptServiceClient} from "../client/client"
import {basename} from "path"
import * as tooltipManager from './atom/tooltipManager'
import * as mainPanelView from "./atom/views/mainPanelView"

type onChangeObserver = (diff: {
  oldRange: TextBuffer.IRange
  newRange: TextBuffer.IRange
  oldText: string
  newText: string
}) => any

interface PaneOptions {
  checkErrors: (pane: TypescriptEditorPane) => any
}

export class TypescriptEditorPane implements AtomCore.Disposable {
  activeAt: number

  checkErrors: (pane: TypescriptEditorPane) => any
  client: TypescriptServiceClient
  filePath: string

  isTypescript = false
  isTSConfig = false

  private isOpen = false

  readonly occurrenceMarkers: AtomCore.IDisplayBufferMarker[] = []
  readonly editor: AtomCore.IEditor
  readonly subscriptions = new CompositeDisposable()

  constructor(editor: AtomCore.IEditor, opts: PaneOptions) {
    this.checkErrors = opts.checkErrors
    this.editor = editor
    this.filePath = editor.getPath()

    this.isTypescript = isTypescriptGrammar(editor.getGrammar())

    this.subscriptions.add(editor.onDidChangeGrammar(grammar => {
      this.isTypescript = isTypescriptGrammar(grammar)
    }))

    if (this.filePath) {
      this.isTSConfig = basename(this.filePath) === "tsconfig.json"
    }

    console.log("opened", this.filePath)

    clientResolver.get(this.filePath).then(client => {
      this.client = client

      this.subscriptions.add(editor.buffer.onDidChange(this.onDidChange))
      this.subscriptions.add(editor.onDidChangeCursorPosition(this.onDidChangeCursorPosition))
      this.subscriptions.add(editor.onDidSave(this.onDidSave))
      this.subscriptions.add(editor.onDidStopChanging(this.onDidStopChanging))

      if (this.isTypescript && this.filePath) {
        this.client.executeOpen({
          file: this.filePath,
          fileContent: this.editor.getText()
        })

        this.checkErrors(this)

        this.isOpen = true
        this.updatePanelConfig()
      }
    })

    this.setupTooltipView()
  }

  async dispose() {
    this.subscriptions.dispose()

    if (this.isOpen) {
      this.client.executeClose({file: this.filePath})
    }
  }

  onActivated = () => {
    this.activeAt = Date.now()

    if (this.isTypescript && this.filePath) {
      mainPanelView.show()
    }
  }

  onDeactivated = () => {
    mainPanelView.hide()
  }

  onDidChange: onChangeObserver = diff => {
    if (this.isOpen) {
      this.client.executeChange({
        endLine: diff.oldRange.end.row+1,
        endOffset: diff.oldRange.end.column+1,
        file: this.editor.getPath(),
        line: diff.oldRange.start.row+1,
        offset: diff.oldRange.start.column+1,
        insertString: diff.newText,
      })
    }
  }

  onDidChangeCursorPosition = () => {
    if (!this.isTypescript) {
      return
    }

    for (const marker of this.occurrenceMarkers) {
      marker.destroy()
    }

    const pos = this.editor.getLastCursor().getBufferPosition()

    this.client.executeOccurances({
      file: this.filePath,
      line: pos.row+1,
      offset: pos.column+1
    }).then(result => {
      for (const ref of result.body) {
        const marker = this.editor.markBufferRange(spanToRange(ref))
        this.editor.decorateMarker(marker as any, {
          type: "highlight",
          class: "atom-typescript-occurrence"
        })
        this.occurrenceMarkers.push(marker)
      }
    }).catch(() => null)
  }

  onDidSave = async event => {
    // Observe editors saving
    console.log("saved", this.editor.getPath())

    if (this.filePath !== event.path) {
      console.log("file path changed to", event.path)
      this.client = await clientResolver.get(event.path)
      this.filePath = event.path
    }
  }

  onDidStopChanging = () => {
    if ((this.isTypescript && this.filePath) || this.isTSConfig) {
      this.checkErrors(this)
    }
  }

  setupTooltipView() {
    // subscribe for tooltips
    // inspiration : https://github.com/chaika2013/ide-haskell
    const editorView = $(atom.views.getView(this.editor))
    tooltipManager.attach(editorView, this.editor)
  }

  async updatePanelConfig() {
    let configPath = ""
    try {
      const result = await this.client.executeProjectInfo({
        needFileNameList: false,
        file: this.filePath
      })
      configPath = result.body.configFileName
    } catch (error) {}

    mainPanelView.panelView.setTsconfigInUse(configPath)
  }
}

function isTypescriptGrammar(grammar: AtomCore.IGrammar): boolean {
  return grammar.scopeName === "source.ts" || grammar.scopeName === "source.tsx"
}
