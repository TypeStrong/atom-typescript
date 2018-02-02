import * as Atom from "atom"
import {CodefixProvider} from "./codefixProvider"

export interface Message {
  filePath: string
  range?: Atom.Range
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
    editor: Atom.TextEditor,
    range: Atom.Range,
    diagnostics: Message[],
  ): Promise<CodeAction[]>
}

export class CodeActionsProvider implements CodeActionProvider {
  public grammarScopes = ["source.ts", "source.tsx"]
  public priority = 0

  constructor(private codefixProvider: CodefixProvider) {}

  async getCodeActions(
    textEditor: Atom.TextEditor,
    range: Atom.Range,
    _diagnostics: Message[],
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
