import * as Atom from "atom"
import {CompositeDisposable} from "atom"
import {flatten} from "lodash"
import {GetClientFunction, TSClient} from "../client"
import {handlePromise} from "../utils"
import {TBuildStatus} from "./atom/components/statusPanel"
import {getProjectCodeSettings, isTypescriptEditorWithPath} from "./atom/utils"
import {TypescriptBuffer} from "./typescriptBuffer"

interface PaneOptions {
  getClient: GetClientFunction
  reportClientVersion: (version: string) => void
  reportTSConfigPath: (path: string | undefined) => void
  reportBuildStatus: (status: TBuildStatus | undefined) => void
  clearErrors: (filePath: string) => void
}

export class TypescriptEditorPane implements Atom.Disposable {
  private static editorMap = new WeakMap<Atom.TextEditor, TypescriptEditorPane>()
  // tslint:disable-next-line:member-ordering
  public static createFactory(
    opts: PaneOptions,
  ): (editor: Atom.TextEditor) => TypescriptEditorPane {
    return (editor: Atom.TextEditor) => {
      let tep = TypescriptEditorPane.editorMap.get(editor)
      if (!tep) {
        tep = new TypescriptEditorPane(editor, opts)
        TypescriptEditorPane.editorMap.set(editor, tep)
      }
      return tep
    }
  }
  // tslint:disable-next-line:member-ordering
  public static lookupPane(editor: Atom.TextEditor): TypescriptEditorPane | undefined {
    return TypescriptEditorPane.editorMap.get(editor)
  }

  // Timestamp for activated event
  public activeAt: number = 0
  public readonly buffer: TypescriptBuffer

  private _client?: Promise<TSClient>
  // Path to the project's tsconfig.json
  private configFile?: string
  private readonly subscriptions = new CompositeDisposable()

  private constructor(public readonly editor: Atom.TextEditor, private opts: PaneOptions) {
    this.buffer = TypescriptBuffer.create(editor.getBuffer(), opts.getClient)
    this.subscriptions.add(
      this.buffer.on("changed", () => handlePromise(this.onChanged())),
      this.buffer.on("closed", () => {
        const filePath = editor.getPath()
        if (filePath !== undefined) this.opts.clearErrors(filePath)
      }),
      this.buffer.on("opened", () => handlePromise(this.onOpened())),
      this.buffer.on("saved", () => handlePromise(this.onSaved())),
    )

    this.checkIfTypescript()

    this.subscriptions.add(
      editor.onDidChangePath(this.checkIfTypescript),
      editor.onDidChangeGrammar(this.checkIfTypescript),
      this.editor.onDidDestroy(this.onDidDestroy),
      atom.workspace.onDidChangeActiveTextEditor(ed => handlePromise(this.changedActiveEditor(ed))),
    )
  }

  public dispose() {
    atom.views.getView(this.editor).classList.remove("typescript-editor")
    this.subscriptions.dispose()
  }

  private changedActiveEditor = async (activeEditor?: Atom.TextEditor) => {
    if (activeEditor === this.editor) {
      // activated
      this.activeAt = Date.now()

      const filePath = this.buffer.getPath()

      console.log(this._client)
      if (this._client) {
        this.opts.reportTSConfigPath(this.configFile)

        if (filePath !== undefined) {
          const client = await this._client
          this.opts.reportClientVersion(client.version)
          await client.execute("geterr", {
            files: [filePath],
            delay: 100,
          })
        }
      }
    }
  }

  private onChanged = async () => {
    if (!this._client) return
    const filePath = this.buffer.getPath()
    if (filePath === undefined) return
    const client = await this._client

    this.opts.reportBuildStatus(undefined)

    await client.execute("geterr", {
      files: [filePath],
      delay: 100,
    })
  }

  private onDidDestroy = () => {
    this.dispose()
  }

  private onOpened = async () => {
    const filePath = this.buffer.getPath()
    if (filePath === undefined) return
    const client = await this.opts.getClient(filePath)

    const isActive = atom.workspace.getActiveTextEditor() === this.editor
    if (isActive) this.opts.reportClientVersion(client.version)

    if (this._client) {
      await client.execute("geterr", {
        files: [filePath],
        delay: 100,
      })

      try {
        const result = await client.execute("projectInfo", {
          needFileNameList: false,
          file: filePath,
        })
        this.configFile = result.body!.configFileName

        if (isActive) this.opts.reportTSConfigPath(this.configFile)

        const options = await getProjectCodeSettings(this.configFile)
        await client.execute("configure", {
          file: filePath,
          formatOptions: options,
        })
      } catch (e) {
        if (window.atom_typescript_debug) console.error(e)
      }
    }
  }

  private onSaved = async () => {
    if (!this._client) return
    const client = await this._client
    await client.execute("geterr", {files: Array.from(this.getOpenEditorsPaths()), delay: 100})
    return this.compileOnSave()
  };

  private *getOpenEditorsPaths() {
    for (const ed of atom.workspace.getTextEditors()) {
      if (isTypescriptEditorWithPath(ed)) yield ed.getPath()!
    }
  }

  private async compileOnSave() {
    if (!this._client) return
    const filePath = this.buffer.getPath()
    if (filePath === undefined) return
    const client = await this._client

    const result = await client.execute("compileOnSaveAffectedFileList", {
      file: filePath,
    })

    this.opts.reportBuildStatus(undefined)

    const fileNames = flatten(result.body.map(project => project.fileNames))

    if (fileNames.length === 0) return

    try {
      const promises = fileNames.map(file => client.execute("compileOnSaveEmitFile", {file}))
      const saved = await Promise.all(promises)

      if (!saved.every(res => !!res.body)) {
        throw new Error("Some files failed to emit")
      }

      this.opts.reportBuildStatus({success: true})
    } catch (error) {
      const e = error as Error
      console.error("Save failed with error", e)
      this.opts.reportBuildStatus({success: false, message: e.message})
    }
  }

  private checkIfTypescript = () => {
    const filePath = this.editor.getPath()

    if (isTypescriptEditorWithPath(this.editor)) {
      this._client = this.opts.getClient(filePath!)
      atom.views.getView(this.editor).classList.add("typescript-editor")
    } else {
      this._client = undefined
      atom.views.getView(this.editor).classList.remove("typescript-editor")
    }
  }
}
