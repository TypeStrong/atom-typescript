import * as Atom from "atom"
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

export class TypescriptEditorPane implements Atom.Disposable {
  // Timestamp for activated event
  public activeAt: number
  public client?: TypescriptServiceClient
  public filePath: string | undefined
  public isTypescript = false
  public readonly buffer: TypescriptBuffer
  public readonly editor: Atom.TextEditor

  // Path to the project's tsconfig.json
  private configFile: string = ""
  private isActive = false
  private opts: PaneOptions
  private isOpen = false

  private readonly occurrenceMarkers: Atom.DisplayMarker[] = []
  private readonly subscriptions = new CompositeDisposable()

  constructor(editor: Atom.TextEditor, opts: PaneOptions) {
    this.updateMarkers = debounce(this.updateMarkers.bind(this), 100)
    this.editor = editor
    this.filePath = editor.getPath()
    this.opts = opts
    this.buffer = TypescriptBuffer.construct(editor.buffer, opts.getClient)
      .on("changed", this.onChanged)
      .on("closed", this.opts.onClose)
      .on("opened", this.onOpened)
      .on("saved", this.onSaved)

    this.isTypescript = isTypescriptGrammar(editor)

    // Add 'typescript-editor' class to the <atom-text-editor> where typescript is active.
    if (this.isTypescript) {
      atom.views.getView(this.editor).classList.add("typescript-editor")
    }

    this.subscriptions.add(
      editor.onDidChangeGrammar(() => {
        this.isTypescript = isTypescriptGrammar(editor)
      }),
    )

    this.subscriptions.add(this.editor.onDidChangeCursorPosition(this.onDidChangeCursorPosition))
    this.subscriptions.add(this.editor.onDidDestroy(this.onDidDestroy))

    tooltipManager.attach(this.editor, this.opts.getClient)
  }

  public dispose() {
    atom.views.getView(this.editor).classList.remove("typescript-editor")
    this.subscriptions.dispose()
    this.opts.onDispose(this)
  }

  public onActivated = () => {
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

        this.opts.statusPanel.update({version: this.client.version})
      }
    }

    this.opts.statusPanel.update({tsConfigPath: this.configFile})
  }

  public onDeactivated = () => {
    this.isActive = false
    this.opts.statusPanel.hide()
  }

  private onChanged = () => {
    if (!this.client) return
    if (!this.filePath) return

    this.opts.statusPanel.update({buildStatus: undefined})

    this.client.executeGetErr({
      files: [this.filePath],
      delay: 100,
    })
  }

  private clearOccurrenceMarkers() {
    for (const marker of this.occurrenceMarkers) {
      marker.destroy()
    }
  }

  private async updateMarkers() {
    if (!this.client) return
    if (!this.filePath) return

    const pos = this.editor.getLastCursor().getBufferPosition()

    try {
      const result = await this.client.executeOccurances({
        file: this.filePath,
        line: pos.row + 1,
        offset: pos.column + 1,
      })

      this.clearOccurrenceMarkers()
      for (const ref of result.body!) {
        const marker = this.editor.markBufferRange(spanToRange(ref))
        this.editor.decorateMarker(marker, {
          type: "highlight",
          class: "atom-typescript-occurrence",
        })
        this.occurrenceMarkers.push(marker)
      }
    } catch (e) {
      if (window.atom_typescript_debug) console.error(e)
    }
  }

  private onDidChangeCursorPosition = ({textChanged}: {textChanged: boolean}) => {
    if (!this.isTypescript || !this.isOpen) return

    if (textChanged) {
      this.clearOccurrenceMarkers()
      return
    }

    this.updateMarkers()
  }

  private onDidDestroy = () => {
    this.dispose()
  }

  private onOpened = async () => {
    const filePath = this.editor.getPath()
    this.filePath = filePath
    if (!filePath) return
    this.client = await this.opts.getClient(filePath)

    // onOpened might trigger before onActivated so we can't rely on isActive flag
    if (atom.workspace.getActiveTextEditor() === this.editor) {
      this.isActive = true
      this.opts.statusPanel.update({version: this.client.version})
    }

    if (this.isTypescript) {
      this.client.executeGetErr({
        files: [filePath],
        delay: 100,
      })

      this.isOpen = true

      try {
        const result = await this.client.executeProjectInfo({
          needFileNameList: false,
          file: filePath,
        })
        this.configFile = result.body!.configFileName

        if (this.isActive) {
          this.opts.statusPanel.update({tsConfigPath: this.configFile})
        }

        getProjectCodeSettings(this.configFile).then(options => {
          this.client!.executeConfigure({
            file: filePath,
            formatOptions: options,
          })
        })
      } catch (e) {
        if (window.atom_typescript_debug) console.error(e)
      }
    }
  }

  private onSaved = () => {
    this.filePath = this.editor.getPath()
    this.opts.onSave(this)
    this.compileOnSave()
  }

  private async compileOnSave() {
    const {client} = this
    if (!client) return
    if (!this.filePath) return

    const result = await client.executeCompileOnSaveAffectedFileList({
      file: this.filePath,
    })

    this.opts.statusPanel.update({buildStatus: undefined})

    const fileNames = flatten(result.body.map(project => project.fileNames))

    if (fileNames.length === 0) return

    try {
      const promises = fileNames.map(file => client.executeCompileOnSaveEmitFile({file}))
      const saved = await Promise.all(promises)

      if (!saved.every(res => !!res.body)) {
        throw new Error("Some files failed to emit")
      }

      this.opts.statusPanel.update({buildStatus: {success: true}})
    } catch (error) {
      console.error("Save failed with error", error)
      this.opts.statusPanel.update({buildStatus: {success: false, message: error.message}})
    }
  }
}
