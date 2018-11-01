import * as Atom from "atom"
import {CompositeDisposable} from "atom"
import {GetClientFunction} from "../client"
import {handlePromise} from "../utils"
import {TBuildStatus} from "./atom/components/statusPanel"
import {isTypescriptEditorWithPath} from "./atom/utils"
import {TypescriptBuffer} from "./typescriptBuffer"

interface PaneOptions {
  getClient: GetClientFunction
  reportClientInfo: (info: {clientVersion: string; tsConfigPath: string | undefined}) => void
  reportBuildStatus: (status: TBuildStatus | undefined) => void
  clearFileErrors: (filePath: string) => void
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
  private readonly buffer: TypescriptBuffer

  private readonly subscriptions = new CompositeDisposable()
  private isTypescript = false

  private constructor(private readonly editor: Atom.TextEditor, private opts: PaneOptions) {
    this.buffer = TypescriptBuffer.create(editor.getBuffer(), opts)
    this.subscriptions.add(
      this.buffer.on("changed", () => {
        this.opts.reportBuildStatus(undefined)
      }),
      this.buffer.on("opened", this.onOpened),
      this.buffer.on("saved", () => {
        handlePromise(this.compileOnSave())
      }),
    )

    this.checkIfTypescript()

    this.subscriptions.add(
      editor.onDidChangePath(this.checkIfTypescript),
      editor.onDidChangeGrammar(this.checkIfTypescript),
      editor.onDidDestroy(this.dispose),
    )
  }

  public dispose = () => {
    atom.views.getView(this.editor).classList.remove("typescript-editor")
    this.subscriptions.dispose()
  }

  /** NOTE:
   * it is implicitly assumed that `atom.workspace.getActiveTextEditor() === this.editor`
   * which has to be ensured at call site
   */
  public didActivate = () => {
    if (this.isTypescript) {
      handlePromise(this.buffer.getErr())
      const info = this.buffer.getInfo()
      if (info) {
        this.opts.reportClientInfo(info)
      }
    }
  }

  private onOpened = () => {
    const isActive = atom.workspace.getActiveTextEditor() === this.editor
    if (isActive) {
      const info = this.buffer.getInfo()
      if (info) {
        this.opts.reportClientInfo(info)
      }
    }
  }

  private async compileOnSave() {
    if (!this.buffer.shouldCompileOnSave()) return
    this.opts.reportBuildStatus(undefined)
    try {
      await this.buffer.compile()
      this.opts.reportBuildStatus({success: true})
    } catch (error) {
      const e = error as Error
      console.error("Save failed with error", e)
      this.opts.reportBuildStatus({success: false, message: e.message})
    }
  }

  private checkIfTypescript = () => {
    this.isTypescript = isTypescriptEditorWithPath(this.editor)

    if (this.isTypescript) {
      atom.views.getView(this.editor).classList.add("typescript-editor")
    } else {
      atom.views.getView(this.editor).classList.remove("typescript-editor")
    }
  }
}
