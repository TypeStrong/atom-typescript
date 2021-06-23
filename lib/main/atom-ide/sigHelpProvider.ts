import {CompositeDisposable, Point, TextEditor} from "atom"
import {SignatureHelp, SignatureHelpProvider} from "atom-ide-base"
import {GetClientFunction} from "../../client"
import {signatureHelpItemToSignature, typeScriptScopes} from "../atom/utils"

let signatureHelpProviderPriority = 100
export class TSSigHelpProvider implements SignatureHelpProvider {
  public triggerCharacters = new Set<string>([])
  public grammarScopes = typeScriptScopes()
  public priority = signatureHelpProviderPriority++
  private disposables = new CompositeDisposable()

  constructor(private getClient: GetClientFunction) {
    const triggerCharsDefault = new Set(["<", "(", ","])
    const triggerCharsDisabled = new Set<string>([])
    this.disposables.add(
      atom.config.observe("atom-typescript.sigHelpDisplayOnChange", (newVal) => {
        this.triggerCharacters = newVal ? triggerCharsDefault : triggerCharsDisabled
      }),
    )
  }

  public dispose() {
    this.disposables.dispose()
  }

  public async getSignatureHelp(
    editor: TextEditor,
    pos: Point,
  ): Promise<SignatureHelp | undefined> {
    try {
      const filePath = editor.getPath()
      if (filePath === undefined) return
      const client = await this.getClient(filePath)
      const result = await client.execute("signatureHelp", {
        file: filePath,
        line: pos.row + 1,
        offset: pos.column + 1,
      })
      const data = result.body!
      const signatures = data.items.map(signatureHelpItemToSignature)
      return {
        signatures,
        activeParameter: data.argumentIndex,
        activeSignature: data.selectedItemIndex,
      }
    } catch (e) {
      return
    }
  }
}
