import {ClientResolver} from "../../../client/clientResolver"
import {ErrorPusher} from "../../errorPusher"
import {spanToRange, pointToLocation} from "../utils"
import {GetTypescriptBuffer} from "../commands/registry"
import {TypescriptServiceClient} from "../../../client/client"

export class CodefixProvider {
  clientResolver: ClientResolver
  errorPusher: ErrorPusher
  getTypescriptBuffer: GetTypescriptBuffer
  supportedFixes: WeakMap<TypescriptServiceClient, Set<number>> = new WeakMap()

  constructor(clientResolver: ClientResolver) {
    this.clientResolver = clientResolver
  }

  async runCodeFix<ResultT>(
    textEditor: AtomCore.IEditor,
    bufferPosition: TextBuffer.IPoint,
    formatCodeFix: (fix: protocol.CodeAction) => ResultT,
  ): Promise<ResultT[]> {
    const filePath = textEditor.getPath()

    if (!filePath || !this.errorPusher || !this.clientResolver || !this.getTypescriptBuffer) {
      return []
    }

    const client = await this.clientResolver.get(filePath)
    const supportedCodes = await this.getSupportedFixes(client)

    const requests = this.errorPusher
      .getErrorsAt(filePath, pointToLocation(bufferPosition))
      .filter(error => error.code && supportedCodes.has(error.code))
      .map(error =>
        client.executeGetCodeFixes({
          file: filePath,
          startLine: error.start.line,
          startOffset: error.start.offset,
          endLine: error.end.line,
          endOffset: error.end.offset,
          errorCodes: [error.code!],
        }),
      )

    const fixes = await Promise.all(requests)
    const results: ResultT[] = []

    for (const result of fixes) {
      if (result.body) {
        for (const fix of result.body) {
          results.push(formatCodeFix(fix))
        }
      }
    }

    return results
  }

  async getSupportedFixes(client: TypescriptServiceClient) {
    let codes = this.supportedFixes.get(client)
    if (codes) {
      return codes
    }

    const result = await client.executeGetSupportedCodeFixes()

    if (!result.body) {
      throw new Error("No code fixes are supported")
    }

    codes = new Set(result.body.map(code => parseInt(code, 10)))
    this.supportedFixes.set(client, codes)
    return codes
  }

  async applyFix(fix: protocol.CodeAction) {
    for (const f of fix.changes) {
      const {buffer, isOpen} = await this.getTypescriptBuffer(f.fileName)

      buffer.buffer.transact(() => {
        for (const edit of f.textChanges) {
          buffer.buffer.setTextInRange(spanToRange(edit), edit.newText)
        }
      })

      if (!isOpen) {
        ;(buffer.buffer.save() as any).then(() => buffer.buffer.destroy())
      }
    }
  }
}
