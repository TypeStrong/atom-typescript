import * as Atom from "atom"
import {ClientResolver} from "../../../client/clientResolver"
import {ErrorPusher} from "../../errorPusher"
import {pointToLocation} from "../utils"
import {TypescriptServiceClient} from "../../../client/client"
import {ApplyEdits} from "../../pluginManager"

export class CodefixProvider {
  private supportedFixes: WeakMap<TypescriptServiceClient, Set<number>> = new WeakMap()

  constructor(
    private clientResolver: ClientResolver,
    private errorPusher: ErrorPusher,
    private applyEdits: ApplyEdits,
  ) {}

  public async runCodeFix(
    textEditor: Atom.TextEditor,
    bufferPosition: Atom.PointLike,
  ): Promise<protocol.CodeAction[]> {
    const filePath = textEditor.getPath()

    if (filePath === undefined) return []

    const client = await this.clientResolver.get(filePath)
    const supportedCodes = await this.getSupportedFixes(client)

    const requests = this.errorPusher
      .getErrorsAt(filePath, pointToLocation(bufferPosition))
      .filter(error => error.code !== undefined && supportedCodes.has(error.code))
      .map(error =>
        client.execute("getCodeFixes", {
          file: filePath,
          startLine: error.start.line,
          startOffset: error.start.offset,
          endLine: error.end.line,
          endOffset: error.end.offset,
          errorCodes: [error.code!],
        }),
      )

    const fixes = await Promise.all(requests)
    const results: protocol.CodeAction[] = []

    for (const result of fixes) {
      if (result.body) {
        for (const fix of result.body) {
          results.push(fix)
        }
      }
    }

    return results
  }

  public async applyFix(fix: protocol.CodeAction) {
    return this.applyEdits(fix.changes)
  }

  public dispose() {
    // NOOP
  }

  private async getSupportedFixes(client: TypescriptServiceClient) {
    let codes = this.supportedFixes.get(client)
    if (codes) {
      return codes
    }

    const result = await client.execute("getSupportedCodeFixes", undefined)

    if (!result.body) {
      throw new Error("No code fixes are supported")
    }

    codes = new Set(result.body.map(code => parseInt(code, 10)))
    this.supportedFixes.set(client, codes)
    return codes
  }
}
