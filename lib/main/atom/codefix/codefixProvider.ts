import * as Atom from "atom"
import {ClientResolver, TSClient} from "../../../client"
import {ErrorPusher} from "../../errorPusher"
import {ApplyEdits} from "../../pluginManager"
import {
  applyRefactors,
  getApplicableRefactorsActions,
  RefactorAction,
} from "../commands/refactorCode"
import {pointToLocation, spanToRange} from "../utils"

export class CodefixProvider {
  private supportedFixes: WeakMap<TSClient, Set<number>> = new WeakMap()

  constructor(
    private clientResolver: ClientResolver,
    private errorPusher: ErrorPusher,
    private applyEdits: ApplyEdits,
  ) {}

  public async getFixableRanges(textEditor: Atom.TextEditor, range: Atom.Range) {
    const filePath = textEditor.getPath()
    if (filePath === undefined) return []
    const errors = this.errorPusher.getErrorsInRange(filePath, range)
    const client = await this.clientResolver.get(filePath)
    const supportedCodes = await this.getSupportedFixes(client)

    const ranges = Array.from(errors)
      .filter((error) => error.code !== undefined && supportedCodes.has(error.code))
      .map((error) => spanToRange(error))

    return ranges
  }

  public async runCodeFix(
    textEditor: Atom.TextEditor,
    bufferPosition: Atom.Point,
  ): Promise<Array<protocol.CodeAction | RefactorAction>> {
    const filePath = textEditor.getPath()

    if (filePath === undefined) return []

    const client = await this.clientResolver.get(filePath)
    const supportedCodes = await this.getSupportedFixes(client)

    const requests = Array.from(this.errorPusher.getErrorsAt(filePath, bufferPosition))
      .filter((error) => error.code !== undefined && supportedCodes.has(error.code))
      .map((error) =>
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
    const results: Array<protocol.CodeAction | RefactorAction> = []

    for (const result of fixes) {
      if (result.body) {
        for (const fix of result.body) {
          results.push(fix)
        }
      }
    }

    const refactors = await getApplicableRefactorsActions(client, {
      file: filePath,
      ...pointToLocation(bufferPosition),
    })

    results.push(...refactors)

    return results
  }

  public async applyFix(fix: protocol.CodeAction | RefactorAction) {
    if ("changes" in fix) return this.applyEdits(fix.changes)
    else {
      const client = await this.clientResolver.get(fix.refactorRange.file)
      return applyRefactors(fix, client, {
        applyEdits: this.applyEdits,
      })
    }
  }

  public dispose() {
    // NOOP
  }

  private async getSupportedFixes(client: TSClient) {
    let codes = this.supportedFixes.get(client)
    if (codes) {
      return codes
    }

    const result = await client.execute("getSupportedCodeFixes")

    if (!result.body) {
      throw new Error("No code fixes are supported")
    }

    codes = new Set(result.body.map((code) => parseInt(code, 10)))
    this.supportedFixes.set(client, codes)
    return codes
  }
}
