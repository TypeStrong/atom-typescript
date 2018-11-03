import * as Atom from "atom"
import {handlePromise} from "../../../utils"
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

export function getIntentionsProvider(
  codefixProvider: CodefixProvider,
): IntentionsProviderInterface {
  return {
    grammarScopes: ["*"],
    async getIntentions({bufferPosition, textEditor}: GetIntentionsOptions): Promise<Intention[]> {
      return (await codefixProvider.runCodeFix(textEditor, bufferPosition)).map(fix => ({
        priority: 100,
        title: fix.description,
        selected: () => {
          handlePromise(codefixProvider.applyFix(fix))
        },
      }))
    },
  }
}
