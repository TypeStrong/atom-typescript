import {CodefixProvider} from "./codefixProvider"

interface Intention {
  priority: number
  icon?: string
  class?: string
  title: string
  selected: () => void
}

interface IIntentionsProvider {
  grammarScopes: string[]
  getIntentions: (opts: GetIntentionsOptions) => Intention[] | Promise<Intention[]>
}

interface GetIntentionsOptions {
  bufferPosition: TextBuffer.IPoint
  textEditor: AtomCore.IEditor
}

export class IntentionsProvider implements IIntentionsProvider {
  grammarScopes = ["*"]

  constructor(private codefixProvider: CodefixProvider) {}

  async getIntentions({bufferPosition, textEditor}: GetIntentionsOptions): Promise<Intention[]> {
    return (await this.codefixProvider.runCodeFix(textEditor, bufferPosition)).map(fix => ({
      priority: 100,
      title: fix.description,
      selected: () => {
        this.codefixProvider.applyFix(fix)
      },
    }))
  }
}
