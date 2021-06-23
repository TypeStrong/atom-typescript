import * as Atom from "atom"
import {CompositeDisposable} from "atom"
import {GetClientFunction} from "../client"
import {TBuildStatus} from "./atom/components/statusPanel"
import {isTypescriptEditorWithPath} from "./atom/utils"
import {TypescriptBuffer} from "./typescriptBuffer"

interface PaneOptions {
  getClient: GetClientFunction
  reportClientInfo: (info: {clientVersion: string; tsConfigPath: string | undefined}) => void
  reportBuildStatus: (status: TBuildStatus | undefined) => void
  clearFileErrors: (filePath: string) => void
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
  public static clearAllCache() {
    this.editorMap = new WeakMap<Atom.TextEditor, TypescriptEditorPane>()
    TypescriptBuffer.clearAllCache()
  }

  private readonly buffer: TypescriptBuffer

  private readonly subscriptions = new CompositeDisposable()
  private isTypescript = false

  private constructor(private readonly editor: Atom.TextEditor, private opts: PaneOptions) {
    this.buffer = TypescriptBuffer.create(editor.getBuffer(), opts)
    this.subscriptions.add(this.buffer.on("opened", this.onOpened))

    this.checkIfTypescript()

    this.subscriptions.add(
      editor.onDidChangePath(this.checkIfTypescript),
      editor.onDidChangeGrammar(this.checkIfTypescript),
      editor.onDidDestroy(this.destroy),
      editor.onDidSave(() => {
        if (atom.config.get("atom-typescript.checkAllFilesOnSave")) {
          atom.commands.dispatch(atom.views.getView(editor), "typescript:check-all-files")
        }
      }),
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
  public didActivate = () => {
    if (this.isTypescript) this.reportInfo()
  }

  private onOpened = () => {
    const isActive = atom.workspace.getActiveTextEditor() === this.editor
    if (isActive) this.reportInfo()
  }

  private reportInfo() {
    const info = this.buffer.getInfo()
    if (info) this.opts.reportClientInfo(info)
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
