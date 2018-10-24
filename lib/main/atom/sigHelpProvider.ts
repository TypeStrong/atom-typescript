import {Point, TextEditor} from "atom"
import {SignatureHelp, SignatureHelpProvider} from "atom/ide"
import {GetClientFunction} from "../../client"
import {WithTypescriptBuffer} from "../pluginManager"
import {signatureHelpItemToSignature, typeScriptScopes} from "./utils"

export class TSSigHelpProvider implements SignatureHelpProvider {
  public triggerCharacters = new Set<string>(["(", ","])
  public grammarScopes = typeScriptScopes()
  public priority = 100

  constructor(
    private getClient: GetClientFunction,
    private withTypescriptBuffer: WithTypescriptBuffer,
  ) {}

  public async getSignatureHelp(
    editor: TextEditor,
    pos: Point,
  ): Promise<SignatureHelp | undefined> {
    try {
      const filePath = editor.getPath()
      if (filePath === undefined) return
      const client = await this.getClient(filePath)
      await this.withTypescriptBuffer(filePath, buffer => buffer.flush())
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
