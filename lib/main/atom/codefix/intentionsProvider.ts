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

interface IntentionHighlight {
  range: Atom.Range
  created: (args: CreatedCallbackArgs) => void
}

interface CreatedCallbackArgs {
  textEditor: Atom.TextEditor
  element: HTMLElement
  marker: Atom.DisplayMarker
  matchedText: string
}

interface IntentionsProviderInterface {
  grammarScopes: string[]
  getIntentions: (opts: GetIntentionsOptions) => Intention[] | Promise<Intention[]>
}

interface IntentionsHighlightsProviderInterface {
  grammarScopes: string[]
  getIntentions: (
    opts: GetIntentionsHighlightsOptions,
  ) => IntentionHighlight[] | Promise<IntentionHighlight[]>
}

interface GetIntentionsOptions {
  bufferPosition: Atom.Point
  textEditor: Atom.TextEditor
}

interface GetIntentionsHighlightsOptions {
  visibleRange: Atom.Range
  textEditor: Atom.TextEditor
}

let intentionsProviderPriority = 100
export function getIntentionsProvider(
  codefixProvider: CodefixProvider,
): IntentionsProviderInterface {
  return {
    grammarScopes: ["*"],
    async getIntentions({bufferPosition, textEditor}) {
      return (await codefixProvider.runCodeFix(textEditor, bufferPosition)).map((fix) => ({
        priority: intentionsProviderPriority++,
        title: "description" in fix ? fix.description : fix.actionDescription,
        selected: () => {
          handlePromise(codefixProvider.applyFix(fix))
        },
      }))
    },
  }
}

export function getIntentionsHighlightsProvider(
  codefixProvider: CodefixProvider,
): IntentionsHighlightsProviderInterface {
  return {
    grammarScopes: ["*"],
    async getIntentions({visibleRange, textEditor}) {
      return (await codefixProvider.getFixableRanges(textEditor, visibleRange)).map((range) => ({
        range,
        created: (_opts: CreatedCallbackArgs) => {
          // NOOP
        },
      }))
    },
  }
}
