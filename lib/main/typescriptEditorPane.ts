import {$} from "atom-space-pen-views"
import {basename} from "path"
import {clientResolver} from "./atomts"
import {CompositeDisposable} from "atom"
import {debounce, flatten} from "lodash"
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
  // Timestamp for didChange event
  changedAt: number

  // Timestamp for activated event
  activeAt: number

  client: TypescriptServiceClient

  // Path to the project's tsconfig.json
  configFile: string = ""

  filePath: string
  isActive = false
  isTSConfig = false
  isTypescript = false

  // Timestamp for last didStopChanging event
  stoppedChangingAt: number

  // Callback that is going to be executed after the next didStopChanging event is processed
  stoppedChangingCallbacks: Function[] = []

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
      this.subscriptions.add(editor.onDidDestroy(this.onDidDestroy))

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
      this.opts.statusPanel.show()

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
    this.opts.statusPanel.hide()
  }

  onDidChange: onChangeObserver = diff => {
    this.changedAt = Date.now()
  }

  clearOccurrenceMarkers() {
    for (const marker of this.occurrenceMarkers) {
      marker.destroy()
    }
  }

  updateMarkers = debounce(() => {
    const pos = this.editor.getLastCursor().getBufferPosition()

    this.client.executeOccurances({
      file: this.filePath,
      line: pos.row+1,
      offset: pos.column+1
    }).then(result => {
      this.clearOccurrenceMarkers()

      for (const ref of result.body) {
        const marker = this.editor.markBufferRange(spanToRange(ref))
        this.editor.decorateMarker(marker as any, {
          type: "highlight",
          class: "atom-typescript-occurrence"
        })
        this.occurrenceMarkers.push(marker)
      }
    }).catch(() => this.clearOccurrenceMarkers())
  }, 100)

  onDidChangeCursorPosition = ({textChanged}) => {
    if (!this.isTypescript) {
      return
    }

    if (textChanged) {
      this.clearOccurrenceMarkers()
      return
    }

    this.updateMarkers()
  }

  onDidDestroy = () => {
    this.dispose()
  }

  onDidSave = async event => {
    if (this.filePath !== event.path) {
      this.client = await clientResolver.get(event.path)
      this.filePath = event.path
      this.isTSConfig = basename(this.filePath) === "tsconfig.json"
    }

    // Check if there isn't a onDidStopChanging event pending. If so, wait for it before updating
    if (this.changedAt && this.changedAt > (this.stoppedChangingAt|0)) {
      await new Promise(resolve => this.stoppedChangingCallbacks.push(resolve))
    }

    if (this.opts.onSave) {
      this.opts.onSave(this)
    }

    this.compileOnSave()
  }

  async compileOnSave() {
    const result = await this.client.executeCompileOnSaveAffectedFileList({
      file: this.filePath
    })

    this.opts.statusPanel.setBuildStatus(null)

    const fileNames = flatten(result.body.map(project => project.fileNames))

    if (fileNames.length === 0) {
      return
    }

    try {
      const promises = fileNames.map(file => this.client.executeCompileOnSaveEmitFile({file}))
      const saved = await Promise.all(promises)

      if (!saved.every(res => res.body)) {
        throw new Error("Some files failed to emit")
      }

      this.opts.statusPanel.setBuildStatus({
        success: true
      })

    } catch (error) {
      console.error("Save failed with error", error)
      this.opts.statusPanel.setBuildStatus({
        success: false
      })
    }
  }

  onDidStopChanging = ({changes}) => {
    this.stoppedChangingAt = Date.now()

    if (this.isTypescript && this.filePath) {
      if (this.isOpen) {

        if (changes.length !== 0) {
          this.opts.statusPanel.setBuildStatus(null)
        }

        for (const change of changes) {
          const {start, oldExtent, newText} = change

          const end = {
            endLine: start.row + oldExtent.row + 1,
            endOffset: (oldExtent.row === 0 ? start.column + oldExtent.column: oldExtent.column) + 1
          }

          this.client.executeChange({
            ...end,
            file: this.filePath,
            line: start.row + 1,
            offset: start.column + 1,
            insertString: newText,
          })
        }
      }

      this.client.executeGetErr({
        files: [this.filePath],
        delay: 100
      })
    }

    this.stoppedChangingCallbacks.forEach(fn => fn())
    this.stoppedChangingCallbacks.length = 0
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
