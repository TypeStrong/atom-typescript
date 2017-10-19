import {CodefixProvider} from "./codefixProvider"

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

export class CodeActionsProvider implements CodeActionProvider {
  public grammarScopes = ["source.ts", "source.tsx"]
  public priority = 0

  constructor(private codefixProvider: CodefixProvider) {}

  async getCodeActions(
    textEditor: AtomCore.IEditor,
    range: TextBuffer.IRange,
    diagnostics: Message[],
  ): Promise<CodeAction[]> {
    return (await this.codefixProvider.runCodeFix(textEditor, range.start)).map(fix => ({
      getTitle: async () => fix.description,
      dispose: () => {},
      apply: async () => {
        await this.codefixProvider.applyFix(fix)
      },
    }))
  }
}
