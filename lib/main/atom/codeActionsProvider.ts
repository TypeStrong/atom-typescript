import {ClientResolver} from "../../client/clientResolver"
import {compact, flatten, debounce} from "lodash"
import {CompositeDisposable} from "atom"
import {ErrorPusher} from "../errorPusher"
import {getEditorPosition, spanToRange, pointToLocation} from "./utils"
import {GetTypescriptBuffer} from "./commands/registry"
import {TypescriptServiceClient} from "../../client/client"

export interface Message {
  filePath: string
  range?: TextBuffer.IRange
  // this interface is rater obviously incomplete
}

export interface CodeAction {
  apply(): Promise<void>
  getTitle(): Promise<string>
  dispose(): void
}

export interface CodeActionProvider {
  grammarScopes: string[]
  priority: number
  getCodeActions(
    editor: AtomCore.IEditor,
    range: TextBuffer.IRange,
    diagnostics: Message[],
  ): Promise<CodeAction[]>
}

export class CodefixActionProvider implements CodeActionProvider {
  public errorPusher: ErrorPusher
  public getTypescriptBuffer: GetTypescriptBuffer
  private supportedFixes: WeakMap<TypescriptServiceClient, Set<number>> = new WeakMap()
  public grammarScopes = ["source.ts", "source.tsx"]
  public priority = 0

  constructor(private clientResolver: ClientResolver) {}

  async getCodeActions(
    textEditor: AtomCore.IEditor,
    range: TextBuffer.IRange,
    diagnostics: Message[],
  ): Promise<CodeAction[]> {
    const filePath = textEditor.getPath()

    if (!filePath || !this.errorPusher || !this.clientResolver || !this.getTypescriptBuffer) {
      return []
    }

    const client = await this.clientResolver.get(filePath)
    const supportedCodes = await this.getSupportedFixes(client)

    const requests = this.errorPusher
      .getErrorsAt(filePath, pointToLocation(range.start))
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
    const results: CodeAction[] = []

    for (const result of fixes) {
      if (result.body) {
        for (const fix of result.body) {
          results.push({
            getTitle: async () => fix.description,
            dispose: () => {},
            apply: async () => {
              for (const f of fix.changes) {
                const {buffer, isOpen} = await this.getTypescriptBuffer(f.fileName)

                buffer.buffer.transact(() => {
                  for (const edit of f.textChanges) {
                    buffer.buffer.setTextInRange(spanToRange(edit), edit.newText)
                  }
                })

                if (!isOpen) {
                  buffer.buffer.save()
                  buffer.on("saved", () => {
                    buffer.buffer.destroy()
                  })
                }
              }
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
