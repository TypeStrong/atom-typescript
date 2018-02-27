import * as Atom from "atom"
import {CodefixProvider} from "./codefixProvider"

interface Intention {
  priority: number
  icon?: string
  class?: string
  title: string
  selected: () => void
}

interface IntentionsProviderInterface {
  grammarScopes: string[]
  getIntentions: (opts: GetIntentionsOptions) => Intention[] | Promise<Intention[]>
}

interface GetIntentionsOptions {
  bufferPosition: Atom.Point
  textEditor: Atom.TextEditor
}

export class IntentionsProvider implements IntentionsProviderInterface {
  public grammarScopes = ["*"]

  constructor(private codefixProvider: CodefixProvider) {}

  public async getIntentions({
    bufferPosition,
    textEditor,
  }: GetIntentionsOptions): Promise<Intention[]> {
    return (await this.codefixProvider.runCodeFix(textEditor, bufferPosition)).map(fix => ({
      priority: 100,
      title: fix.description,
      selected: () => {
        this.codefixProvider.applyFix(fix)
      },
    }))
  }
}
