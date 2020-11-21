// more: https://github.com/atom-community/autocomplete-plus/wiki/Provider-API
import * as Atom from "atom"
import * as ACP from "atom/autocomplete-plus"
import * as fuzzaldrin from "fuzzaldrin"
import {
  CompletionEntryDetails,
  CompletionEntryIdentifier,
  CompletionsTriggerCharacter,
} from "typescript/lib/protocol"
import {GetClientFunction, TSClient} from "../../client"
import {handlePromise} from "../../utils"
import {ApplyEdits} from "../pluginManager"
import {codeActionTemplate} from "./codeActionTemplate"
import {FileLocationQuery, spanToRange, typeScriptScopes} from "./utils"
import {selectListView} from "./views/simpleSelectionView"

type SuggestionWithDetails = ACP.TextSuggestion & {
  replacementRange?: Atom.Range
  isMemberCompletion?: boolean
  identifier?: CompletionEntryIdentifier | string
  hasAction?: boolean
}

interface Details {
  details: CompletionEntryDetails
  rightLabel: string
  description?: string
}

export class AutocompleteProvider implements ACP.AutocompleteProvider {
  public selector = typeScriptScopes()
    .map((x) => (x.includes(".") ? `.${x}` : x))
    .join(", ")

  public disableForSelector = ".comment"

  public inclusionPriority = 3
  public suggestionPriority = atom.config.get("atom-typescript").autocompletionSuggestionPriority
  public excludeLowerPriority = false

  private lastSuggestions?: {
    // Client used to get the suggestions
    client: TSClient

    // File and position for the suggestions
    location: FileLocationQuery

    // Prefix used
    prefix: string

    // The completions that were returned for the position
    suggestions: SuggestionWithDetails[]
    details: Map<string, Details>
  }

  constructor(private getClient: GetClientFunction, private applyEdits: ApplyEdits) {}

  public async getSuggestions(opts: ACP.SuggestionsRequestedEvent): Promise<ACP.AnySuggestion[]> {
    const location = getLocationQuery(opts)
    const prefix = getPrefix(opts)

    if (!location) return []

    // Don't auto-show autocomplete if prefix is empty unless last character is '.'
    const triggerCharacter = getTrigger(
      getLastNonWhitespaceChar(opts.editor.getBuffer(), opts.bufferPosition),
    )
    if (!prefix && !opts.activatedManually && !triggerCharacter) return []

    // Don't show autocomplete if we're in a string.template and not in a template expression
    if (
      containsScope(opts.scopeDescriptor.getScopesArray(), "string.template.") &&
      !containsScope(opts.scopeDescriptor.getScopesArray(), "template.expression.")
    ) {
      return []
    }

    try {
      let suggestions = await this.getSuggestionsWithCache({
        prefix,
        location,
        triggerCharacter,
        activatedManually: opts.activatedManually,
      })

      suggestions = fuzzaldrin.filter(suggestions, prefix, {
        key: "displayText",
      })

      return suggestions.map((suggestion) => ({
        replacementPrefix: suggestion.replacementRange
          ? opts.editor.getTextInBufferRange(suggestion.replacementRange)
          : prefix,
        location,
        ...this.getDetailsFromCache(suggestion),
        ...addCallableParens(opts, suggestion),
      }))
    } catch (error) {
      return []
    }
  }

  public async getSuggestionDetailsOnSelect(suggestion: ACP.AnySuggestion) {
    if ("text" in suggestion && !("rightLabel" in suggestion)) {
      return this.getAdditionalDetails(suggestion)
    } else {
      return null
    }
  }

  public onDidInsertSuggestion(evt: ACP.SuggestionInsertedEvent) {
    const s = evt.suggestion as SuggestionWithDetails
    if (!s.hasAction) return
    if (!this.lastSuggestions) return
    const client = this.lastSuggestions.client
    let details = this.getDetailsFromCache(s)
    handlePromise(
      (async () => {
        if (!details) details = await this.getAdditionalDetails(s)
        if (!details?.details.codeActions) return
        let action
        if (details.details.codeActions.length === 1) {
          action = details.details.codeActions[0]
        } else {
          action = await selectListView({
            items: details.details.codeActions,
            itemTemplate: codeActionTemplate,
            itemFilterKey: "description",
          })
        }
        if (!action) return
        await this.applyEdits(action.changes)
        if (!action.commands) return
        await Promise.all(
          action.commands.map((cmd) =>
            client.execute("applyCodeActionCommand", {
              command: cmd,
            }),
          ),
        )
      })(),
    )
  }

  private async getAdditionalDetails(suggestion: SuggestionWithDetails) {
    if (suggestion.identifier === undefined) return null
    if (!this.lastSuggestions) return null
    const reply = await this.lastSuggestions.client.execute("completionEntryDetails", {
      entryNames: [suggestion.identifier],
      ...this.lastSuggestions.location,
    })
    if (!reply.body) return null
    const [details] = reply.body
    // apparently, details can be undefined
    // tslint:disable-next-line: strict-boolean-expressions
    if (!details) return null
    let parts = details.displayParts
    if (
      parts.length >= 3 &&
      parts[0].text === "(" &&
      parts[1].text === suggestion.leftLabel &&
      parts[2].text === ")"
    ) {
      parts = parts.slice(3)
    }
    let rightLabel = parts.map((d) => d.text).join("")
    const actionDesc =
      suggestion.hasAction && details.codeActions?.length === 1
        ? `${details.codeActions[0].description}\n\n`
        : ""
    if (actionDesc) rightLabel = actionDesc
    const description =
      actionDesc +
      details.displayParts.map((d) => d.text).join("") +
      (details.documentation ? "\n\n" + details.documentation.map((d) => d.text).join(" ") : "")
    this.lastSuggestions.details.set(suggestion.displayText!, {details, rightLabel, description})
    return {
      ...suggestion,
      details,
      rightLabel,
      description,
    }
  }

  private getDetailsFromCache(suggestion: SuggestionWithDetails) {
    if (!this.lastSuggestions) return null
    const d = this.lastSuggestions.details.get(suggestion.displayText!)
    if (!d) return null
    return d
  }

  // Try to reuse the last completions we got from tsserver if they're for the same position.
  private async getSuggestionsWithCache({
    prefix,
    location,
    triggerCharacter,
    activatedManually,
  }: {
    prefix: string
    location: FileLocationQuery
    triggerCharacter?: CompletionsTriggerCharacter
    activatedManually: boolean
  }): Promise<SuggestionWithDetails[]> {
    if (this.lastSuggestions && !activatedManually) {
      const lastLoc = this.lastSuggestions.location
      const lastCol = getNormalizedCol(this.lastSuggestions.prefix, lastLoc.offset)
      const thisCol = getNormalizedCol(prefix, location.offset)

      if (lastLoc.file === location.file && lastLoc.line === location.line && lastCol === thisCol) {
        if (this.lastSuggestions.suggestions.length !== 0) {
          return this.lastSuggestions.suggestions
        }
      }
    }

    const client = await this.getClient(location.file)
    const suggestions = await getSuggestionsInternal({
      client,
      location,
      triggerCharacter: activatedManually ? undefined : triggerCharacter,
    })

    this.lastSuggestions = {
      client,
      location,
      prefix,
      suggestions,
      details: new Map(),
    }

    return suggestions
  }
}

async function getSuggestionsInternal({
  client,
  location,
  triggerCharacter,
}: {
  client: TSClient
  location: FileLocationQuery
  triggerCharacter?: CompletionsTriggerCharacter
}) {
  if (parseInt(client.version.split(".")[0], 10) >= 3) {
    // use completionInfo
    const completions = await client.execute("completionInfo", {
      includeExternalModuleExports: false,
      includeInsertTextCompletions: true,
      triggerCharacter,
      ...location,
    })
    return completions.body!.entries.map(
      completionEntryToSuggestion.bind(null, completions.body?.isMemberCompletion),
    )
  } else {
    // use deprecated completions
    const completions = await client.execute("completions", {
      includeExternalModuleExports: false,
      includeInsertTextCompletions: true,
      ...location,
    })

    return completions.body!.map(completionEntryToSuggestion.bind(null, undefined))
  }
}

// this should more or less match ES6 specification for valid identifiers
const identifierMatch = /(?:(?![\u{10000}-\u{10FFFF}])[\$_\p{Lu}\p{Ll}\p{Lt}\p{Lm}\p{Lo}\p{Nl}])(?:(?![\u{10000}-\u{10FFFF}])[\$_\p{Lu}\p{Ll}\p{Lt}\p{Lm}\p{Lo}\p{Nl}\u200C\u200D\p{Mn}\p{Mc}\p{Nd}\p{Pc}])*$/u

// Decide what needs to be replaced in the editor buffer when inserting the completion
function getPrefix(opts: ACP.SuggestionsRequestedEvent): string {
  // see https://github.com/TypeStrong/atom-typescript/issues/1528
  // for the motivating example.
  const line = opts.editor
    .getBuffer()
    .getTextInRange([[opts.bufferPosition.row, 0], opts.bufferPosition])
  const idMatch = line.match(identifierMatch)
  if (idMatch) return idMatch[0]
  else return ""
}

// When the user types each character in ".hello", we want to normalize the column such that it's
// the same for every invocation of the getSuggestions. In this case, it would be right after "."
function getNormalizedCol(prefix: string, col: number): number {
  const length = prefix === "." ? 0 : prefix.length
  return col - length
}

function getLocationQuery(opts: ACP.SuggestionsRequestedEvent): FileLocationQuery | undefined {
  const path = opts.editor.getPath()
  if (path === undefined) {
    return undefined
  }
  return {
    file: path,
    line: opts.bufferPosition.row + 1,
    offset: opts.bufferPosition.column + 1,
  }
}

function getLastNonWhitespaceChar(buffer: Atom.TextBuffer, pos: Atom.Point): string | undefined {
  let lastChar: string | undefined
  const range = new Atom.Range([0, 0], pos)
  buffer.backwardsScanInRange(
    /\S/,
    range,
    ({matchText, stop}: {matchText: string; stop: () => void}) => {
      lastChar = matchText
      stop()
    },
  )
  return lastChar
}

function containsScope(scopes: ReadonlyArray<string>, matchScope: string): boolean {
  for (const scope of scopes) {
    if (scope.includes(matchScope)) {
      return true
    }
  }

  return false
}

function completionEntryToSuggestion(
  isMemberCompletion: boolean | undefined,
  entry: protocol.CompletionEntry,
): SuggestionWithDetails {
  return {
    displayText: entry.name,
    text: entry.insertText !== undefined ? entry.insertText : entry.name,
    leftLabel: entry.kind,
    replacementRange: entry.replacementSpan ? spanToRange(entry.replacementSpan) : undefined,
    type: kindMap[entry.kind],
    isMemberCompletion,
    identifier: entry.source !== undefined ? {name: entry.name, source: entry.source} : entry.name,
    hasAction: entry.hasAction,
  }
}

function parens(opts: ACP.SuggestionsRequestedEvent) {
  const buffer = opts.editor.getBuffer()
  const pt = opts.bufferPosition
  const lookahead = buffer.getTextInRange([pt, [pt.row, buffer.lineLengthForRow(pt.row)]])
  return !!lookahead.match(/\s*\(/)
}

function addCallableParens(
  opts: ACP.SuggestionsRequestedEvent,
  s: SuggestionWithDetails,
): ACP.TextSuggestion | ACP.SnippetSuggestion {
  if (
    atom.config.get("atom-typescript.autocompleteParens") &&
    ["function", "method"].includes(s.leftLabel!) &&
    !parens(opts)
  ) {
    return {...s, snippet: `${s.text}($1)`, text: undefined}
  } else return s
}

/** From :
 * https://github.com/atom-community/autocomplete-plus/pull/334#issuecomment-85697409
 */
type ACPCompletionType =
  | "variable"
  | "constant"
  | "property"
  | "value"
  | "method"
  | "function"
  | "class"
  | "type"
  | "keyword"
  | "tag"
  | "import"
  | "require"
  | "snippet"

const kindMap: {[key in protocol.ScriptElementKind]: ACPCompletionType | undefined} = {
  directory: "require",
  module: "import",
  "external module name": "import",
  class: "class",
  "local class": "class",
  method: "method",
  property: "property",
  getter: "property",
  setter: "property",
  "JSX attribute": "property",
  constructor: "method",
  enum: "type",
  interface: "type",
  type: "type",
  "type parameter": "type",
  "primitive type": "type",
  function: "function",
  "local function": "function",
  label: "variable",
  alias: "import",
  var: "variable",
  let: "variable",
  "local var": "variable",
  parameter: "variable",
  "enum member": "constant",
  const: "constant",
  string: "value",
  keyword: "keyword",
  "": undefined,
  warning: undefined,
  script: undefined,
  call: undefined,
  index: undefined,
  construct: undefined,
}

// This may look strange, but it guarantees the list is consistent with the type
const triggerCharactersMap: {[K in CompletionsTriggerCharacter]: null} = {
  ".": null,
  '"': null,
  "'": null,
  "`": null,
  "/": null,
  "@": null,
  "<": null,
  "#": null,
}
const triggerCharacters = new Set<CompletionsTriggerCharacter>(Object.keys(triggerCharactersMap))
function getTrigger(prefix: string | undefined): CompletionsTriggerCharacter | undefined {
  if (prefix === undefined) return undefined
  if (!prefix) return undefined
  const c = prefix.slice(-1)
  if (triggerCharacters.has(c as CompletionsTriggerCharacter)) {
    return c as CompletionsTriggerCharacter
  }
  return undefined
}
