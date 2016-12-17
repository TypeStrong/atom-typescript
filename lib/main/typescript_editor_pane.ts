import {$} from "atom-space-pen-views"
import {basename} from "path"
import {clientResolver} from "./atomts"
import {CompositeDisposable} from "atom"
import {spanToRange} from "./utils/tsUtil"
import {TypescriptServiceClient} from "../client/client"
import {StatusPanel} from "./atom/components/statusPanel"
import * as tooltipManager from './atom/tooltipManager'

type onChangeObserver = (diff: {
  oldRange: TextBuffer.IRange
  newRange: TextBuffer.IRange
  oldText: string
  newText: string
}) => any

interface PaneOptions {
  onDispose: (pane: TypescriptEditorPane) => any
  onSave: (pane: TypescriptEditorPane) => any
  statusPanel: StatusPanel
}

export class TypescriptEditorPane implements AtomCore.Disposable {
  activeAt: number
  client: TypescriptServiceClient
  configFile: string = ""
  filePath: string
  isActive = false
  isTSConfig = false
  isTypescript = false

  private opts: PaneOptions
  private isOpen = false

  readonly occurrenceMarkers: AtomCore.IDisplayBufferMarker[] = []
  readonly editor: AtomCore.IEditor
  readonly subscriptions = new CompositeDisposable()

  constructor(editor: AtomCore.IEditor, opts: PaneOptions) {
    this.editor = editor
    this.filePath = editor.getPath()
    this.opts = opts

    this.isTypescript = isTypescriptGrammar(editor.getGrammar())

    this.subscriptions.add(editor.onDidChangeGrammar(grammar => {
      this.isTypescript = isTypescriptGrammar(grammar)
    }))

    if (this.filePath) {
      this.isTSConfig = basename(this.filePath) === "tsconfig.json"
    }

    clientResolver.get(this.filePath).then(client => {
      this.client = client

      this.subscriptions.add(editor.buffer.onDidChange(this.onDidChange))
      this.subscriptions.add(editor.onDidChangeCursorPosition(this.onDidChangeCursorPosition))
      this.subscriptions.add(editor.onDidSave(this.onDidSave))
      this.subscriptions.add(editor.onDidStopChanging(this.onDidStopChanging))

      if (this.isActive) {
        this.opts.statusPanel.setVersion(this.client.version)
      }

      if (this.isTypescript && this.filePath) {
        this.client.executeOpen({
          file: this.filePath,
          fileContent: this.editor.getText()
        })

        this.client.executeGetErr({
          files: [this.filePath],
          delay: 100
        })

        this.isOpen = true

        this.client.executeProjectInfo({
          needFileNameList: false,
          file: this.filePath
        }).then(result => {
          this.configFile = result.body.configFileName

          if (this.isActive) {
            this.opts.statusPanel.setTsConfigPath(this.configFile)
          }
        }, error => null)
      }
    })

    this.setupTooltipView()
  }

  dispose() {
    this.subscriptions.dispose()

    if (this.isOpen) {
      this.client.executeClose({file: this.filePath})
    }

    this.opts.onDispose(this)
  }

  onActivated = () => {
    this.activeAt = Date.now()
    this.isActive = true

    if (this.isTypescript && this.filePath) {
      // this.mainPanel.show()

      if (this.client) {
        // The first activation might happen before we even have a client
        this.client.executeGetErr({
          files: [this.filePath],
          delay: 100
        })

        this.opts.statusPanel.setVersion(this.client.version)
      }
    }

    this.opts.statusPanel.setTsConfigPath(this.configFile)
  }

  onDeactivated = () => {
    this.isActive = false
    // this.mainPanel.hide()
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
    console.log("saved", this.filePath)

    if (this.filePath !== event.path) {
      console.log("file path changed to", event.path)
      this.client = await clientResolver.get(event.path)
      this.filePath = event.path
      this.isTSConfig = basename(this.filePath) === "tsconfig.json"
    }

    if (this.opts.onSave) {
      this.opts.onSave(this)
    }

    const result = await this.client.executeCompileOnSaveAffectedFileList({
      file: this.filePath
    })

    for (const project of result.body) {
      for (const file of project.fileNames) {
        this.client.executeCompileOnSaveEmitFile({file})
      }
    }
  }

  onDidStopChanging = () => {
    console.log("did stop changing", this.filePath)
    if (this.isTypescript && this.filePath) {
      this.client.executeGetErr({
        files: [this.filePath],
        delay: 100
      })
    }
  }

  setupTooltipView() {
    // subscribe for tooltips
    // inspiration : https://github.com/chaika2013/ide-haskell
    const editorView = $(atom.views.getView(this.editor))
    tooltipManager.attach(editorView, this.editor)
  }
}

function isTypescriptGrammar(grammar: AtomCore.IGrammar): boolean {
  return grammar.scopeName === "source.ts" || grammar.scopeName === "source.tsx"
}
