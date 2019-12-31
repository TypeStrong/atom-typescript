import * as Atom from "atom"
import {CompositeDisposable} from "atom"
import {GetClientFunction, GetErrorsFunction, PushErrorFunction} from "../client"
import {TBuildStatus, TProgress} from "./atom/components/statusPanel"
import {isTypescriptEditorWithPath} from "./atom/utils"
import {TypescriptBuffer} from "./typescriptBuffer"

interface ClientInfo {
  clientVersion: string
  tsConfigPath: string | undefined
}

interface PaneOptions {
  getClient: GetClientFunction
  reportClientInfo: (info: ClientInfo) => void
  reportBuildStatus: (status?: TBuildStatus) => void
  clearFileErrors: (triggerFile?: string) => void
  reportProgress: (progress: TProgress) => void
  getFileErrors: GetErrorsFunction
  pushFileError: PushErrorFunction
}

export class TypescriptEditorPane {
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

  private readonly buffer: TypescriptBuffer

  private readonly subscriptions = new CompositeDisposable()
  private clientInfo: ClientInfo | undefined
  private isTypescript = false

  private constructor(private readonly editor: Atom.TextEditor, private opts: PaneOptions) {
    this.buffer = TypescriptBuffer.create(editor.getBuffer(), opts)
    this.subscriptions.add(this.buffer.on("opened", this.onOpened))

    this.checkIfTypescript()

    this.subscriptions.add(
      editor.onDidChangePath(this.checkIfTypescript),
      editor.onDidChangeGrammar(this.checkIfTypescript),
      editor.onDidDestroy(this.destroy),
    )
  }

  public destroy = () => {
    atom.views.getView(this.editor).classList.remove("typescript-editor")
    this.subscriptions.dispose()
  }

  /** NOTE:
   * it is implicitly assumed that `atom.workspace.getActiveTextEditor() === this.editor`
   * which has to be ensured at call site
   */
  public didActivate = (isModified: boolean) => {
    if (this.isTypescript) {
      const info = this.reportInfo()
      if (isModified || this.clientInfo?.tsConfigPath !== info?.tsConfigPath) {
        this.buffer.updateDiag()
      }
      this.clientInfo = info
    }
  }

  private onOpened = () => {
    const isActive = atom.workspace.getActiveTextEditor() === this.editor
    if (isActive) this.reportInfo()
  }

  private reportInfo() {
    const info = this.buffer.getInfo()
    if (info) {
      this.opts.reportClientInfo(info)
      return info
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
