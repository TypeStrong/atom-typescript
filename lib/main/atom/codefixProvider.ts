import {ClientResolver} from "../../client/clientResolver"
import {compact, flatten, debounce} from "lodash"
import {CompositeDisposable} from "atom"
import {ErrorPusher} from "../errorPusher"
import {getEditorPosition, spanToRange, pointToLocation} from "./utils"
import {GetTypescriptBuffer} from "./commands/registry"
import {TypescriptServiceClient} from "../../client/client"

interface Intention {
  priority: number
  icon?: string
  class?: string
  title: string
  selected: () => void
}

interface IntentionsProvider {
  grammarScopes: string[]
  getIntentions: (opts: GetIntentionsOptions) => Intention[] | Promise<Intention[]>
}

interface GetIntentionsOptions {
  bufferPosition: TextBuffer.IPoint
  textEditor: AtomCore.IEditor
}

export class CodefixProvider implements IntentionsProvider {
  clientResolver: ClientResolver
  errorPusher: ErrorPusher
  getTypescriptBuffer: GetTypescriptBuffer
  grammarScopes = ["*"]
  supportedFixes: WeakMap<TypescriptServiceClient, Set<number>> = new WeakMap()

  constructor(clientResolver: ClientResolver) {
    this.clientResolver = clientResolver
  }

  async getIntentions({bufferPosition, textEditor}: GetIntentionsOptions): Promise<Intention[]> {
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
    const results: Intention[] = []

    for (const result of fixes) {
      if (result.body) {
        for (const fix of result.body) {
          results.push({
            priority: 100,
            title: fix.description,
            selected: () => {
              fix.changes.forEach(async fix => {
                const {buffer, isOpen} = await this.getTypescriptBuffer(fix.fileName)

                buffer.buffer.transact(() => {
                  for (const edit of fix.textChanges) {
                    buffer.buffer.setTextInRange(spanToRange(edit), edit.newText)
                  }
                })

                if (!isOpen) {
                  buffer.buffer.save()
                  buffer.on("saved", () => {
                    buffer.buffer.destroy()
                  })
                }
              })
            },
          })
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
}
