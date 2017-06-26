import {$} from "atom-space-pen-views"
import {CompositeDisposable} from "atom"
import {debounce, flatten} from "lodash"
import {spanToRange, isTypescriptGrammar, getProjectCodeSettings} from "./atom/utils"
import {StatusPanel} from "./atom/components/statusPanel"
import {TypescriptBuffer} from "./typescriptBuffer"
import {TypescriptServiceClient} from "../client/client"
import * as tooltipManager from "./atom/tooltipManager"

interface PaneOptions {
  getClient: (filePath: string) => Promise<TypescriptServiceClient>

  // Called when the pane is being disposed.
  onDispose: (pane: TypescriptEditorPane) => void

  // Called when the Typescript view of the file is closed. This happens when the pane is closed
  // and also when the file is renamed.
  onClose: (filePath: string) => void

  onSave: (pane: TypescriptEditorPane) => void
  statusPanel: StatusPanel
}

export class TypescriptEditorPane implements AtomCore.Disposable {
  // Timestamp for activated event
  activeAt: number

  buffer: TypescriptBuffer
  client?: TypescriptServiceClient

  // Path to the project's tsconfig.json
  configFile: string = ""

  filePath: string
  isActive = false
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
    this.buffer = new TypescriptBuffer(editor.buffer, opts.getClient)
      .on("changed", this.onChanged)
      .on("closed", this.opts.onClose)
      .on("opened", this.onOpened)
      .on("saved", this.onSaved)

    this.isTypescript = isTypescriptGrammar(editor.getGrammar())

    // Add 'typescript-editor' class to the <atom-text-editor> where typescript is active.
    if (this.isTypescript) {
      this.editor.element.classList.add("typescript-editor")
    }

    this.subscriptions.add(
      editor.onDidChangeGrammar(grammar => {
        this.isTypescript = isTypescriptGrammar(grammar)
      }),
    )

    this.subscriptions.add(this.editor.onDidChangeCursorPosition(this.onDidChangeCursorPosition))
    this.subscriptions.add(this.editor.onDidDestroy(this.onDidDestroy))

    this.setupTooltipView()
  }

  dispose() {
    this.editor.element.classList.remove("typescript-editor")
    this.subscriptions.dispose()
    this.opts.onDispose(this)
  }

  onActivated = () => {
    this.activeAt = Date.now()
    this.isActive = true

    if (this.isTypescript && this.filePath) {
      this.opts.statusPanel.show()

      // The first activation might happen before we even have a client
      if (this.client) {
        this.client.executeGetErr({
          files: [this.filePath],
          delay: 100,
        })

        this.opts.statusPanel.setVersion(this.client.version)
      }
    }

    this.opts.statusPanel.setTsConfigPath(this.configFile)
  }

  onChanged = () => {
    if (!this.client) return

    this.opts.statusPanel.setBuildStatus(undefined)

    this.client.executeGetErr({
      files: [this.filePath],
      delay: 100,
    })
  }

  onDeactivated = () => {
    this.isActive = false
    this.opts.statusPanel.hide()
  }

  clearOccurrenceMarkers() {
    for (const marker of this.occurrenceMarkers) {
      marker.destroy()
    }
  }

  updateMarkers = debounce(() => {
    if (!this.client) return

    const pos = this.editor.getLastCursor().getBufferPosition()

    this.client
      .executeOccurances({
        file: this.filePath,
        line: pos.row + 1,
        offset: pos.column + 1,
      })
      .then(result => {
        this.clearOccurrenceMarkers()

        for (const ref of result.body!) {
          const marker = this.editor.markBufferRange(spanToRange(ref))
          this.editor.decorateMarker(marker as any, {
            type: "highlight",
            class: "atom-typescript-occurrence",
          })
          this.occurrenceMarkers.push(marker)
        }
      })
      .catch(() => this.clearOccurrenceMarkers())
  }, 100)

  onDidChangeCursorPosition = ({textChanged}: {textChanged: boolean}) => {
    if (!this.isTypescript || !this.isOpen) {
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

  onOpened = async () => {
    this.filePath = this.editor.getPath()
    this.client = await this.opts.getClient(this.filePath)

    // onOpened might trigger before onActivated so we can't rely on isActive flag
    if (atom.workspace.getActiveTextEditor() === this.editor) {
      this.isActive = true
      this.opts.statusPanel.setVersion(this.client.version)
    }

    if (this.isTypescript && this.filePath) {
      this.client.executeGetErr({
        files: [this.filePath],
        delay: 100,
      })

      this.isOpen = true

      this.client
        .executeProjectInfo({
          needFileNameList: false,
          file: this.filePath,
        })
        .then(result => {
          this.configFile = result.body!.configFileName

          if (this.isActive) {
            this.opts.statusPanel.setTsConfigPath(this.configFile)
          }

          getProjectCodeSettings(this.filePath, this.configFile).then(options => {
            this.client!.executeConfigure({
              file: this.filePath,
              formatOptions: options,
            })
          })
        }, error => null)
    }
  }

  onSaved = () => {
    this.filePath = this.editor.getPath()
    this.opts.onSave(this)
    this.compileOnSave()
  }

  async compileOnSave() {
    const {client} = this
    if (!client) return

    const result = await client.executeCompileOnSaveAffectedFileList({
      file: this.filePath,
    })

    this.opts.statusPanel.setBuildStatus(undefined)

    const fileNames = flatten(result.body.map(project => project.fileNames))

    if (fileNames.length === 0) {
      return
    }

    try {
      const promises = fileNames.map(file => client.executeCompileOnSaveEmitFile({file}))
      const saved = await Promise.all(promises)

      if (!saved.every(res => res.body)) {
        throw new Error("Some files failed to emit")
      }

      this.opts.statusPanel.setBuildStatus({
        success: true,
      })
    } catch (error) {
      console.error("Save failed with error", error)
      this.opts.statusPanel.setBuildStatus({
        success: false,
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
