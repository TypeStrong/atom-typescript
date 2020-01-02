// more: https://github.com/atom-community/autocomplete-plus/wiki/Provider-API
import * as Atom from "atom"
import * as ACP from "atom/autocomplete-plus"
import * as fuzzaldrin from "fuzzaldrin"
import {GetClientFunction, TSClient} from "../../client"
import {FileLocationQuery, inits, spanToRange, typeScriptScopes} from "./utils"

type SuggestionWithDetails = ACP.TextSuggestion & {
  details?: protocol.CompletionEntryDetails
  replacementRange?: Atom.Range
  isMemberCompletion?: boolean
}

export class AutocompleteProvider implements ACP.AutocompleteProvider {
  public selector = typeScriptScopes()
    .map(x => (x.includes(".") ? `.${x}` : x))
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
  }

  constructor(private getClient: GetClientFunction) {}

  public async getSuggestions(opts: ACP.SuggestionsRequestedEvent): Promise<ACP.AnySuggestion[]> {
    const location = getLocationQuery(opts)
    const {prefix} = opts

    if (!location) {
      return []
    }

    // Don't show autocomplete if the previous character was a non word character except "."
    const lastChar = getLastNonWhitespaceChar(opts.editor.getBuffer(), opts.bufferPosition)
    if (lastChar !== undefined && !opts.activatedManually) {
      if (/\W/i.test(lastChar) && lastChar !== ".") {
        return []
      }
    }

    // Don't show autocomplete if we're in a string.template and not in a template expression
    if (
      containsScope(opts.scopeDescriptor.getScopesArray(), "string.template.") &&
      !containsScope(opts.scopeDescriptor.getScopesArray(), "template.expression.")
    ) {
      return []
    }

    try {
      let suggestions = await this.getSuggestionsWithCache(prefix, location, opts.activatedManually)

      const alphaPrefix = prefix.replace(/\W/g, "")
      if (alphaPrefix !== "") {
        suggestions = fuzzaldrin.filter(suggestions, alphaPrefix, {
          key: "displayText",
        })
      }

      // Get additional details for the first few suggestions
      await this.getAdditionalDetails(suggestions.slice(0, 10), location)

      return suggestions.map(suggestion => ({
        replacementPrefix: suggestion.replacementRange
          ? opts.editor.getTextInBufferRange(suggestion.replacementRange)
          : getReplacementPrefix(opts, suggestion),
        ...addCallableParens(suggestion),
      }))
    } catch (error) {
      return []
    }
  }

  private async getAdditionalDetails(
    suggestions: SuggestionWithDetails[],
    location: FileLocationQuery,
  ) {
    if (suggestions.some(s => !s.details) && this.lastSuggestions) {
      const details = await this.lastSuggestions.client.execute("completionEntryDetails", {
        entryNames: suggestions.map(s => s.displayText!),
        ...location,
      })

      details.body!.forEach((detail, i) => {
        const suggestion = suggestions[i]

        suggestion.details = detail
        let parts = detail.displayParts
        if (
          parts.length >= 3 &&
          parts[0].text === "(" &&
          parts[1].text === suggestion.leftLabel &&
          parts[2].text === ")"
        ) {
          parts = parts.slice(3)
        }
        suggestion.rightLabel = parts.map(d => d.text).join("")

        suggestion.description =
          detail.documentation && detail.documentation.map(d => d.text).join(" ")
      })
    }
  }

  // Try to reuse the last completions we got from tsserver if they're for the same position.
  private async getSuggestionsWithCache(
    prefix: string,
    location: FileLocationQuery,
    activatedManually: boolean,
  ): Promise<SuggestionWithDetails[]> {
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
    const suggestions = await getSuggestionsInternal(client, location, prefix)

    this.lastSuggestions = {
      client,
      location,
      prefix,
      suggestions,
    }

    return suggestions
  }
}

async function getSuggestionsInternal(
  client: TSClient,
  location: FileLocationQuery,
  prefix: string,
) {
  if (parseInt(client.version.split(".")[0], 10) >= 3) {
    // use completionInfo
    const completions = await client.execute("completionInfo", {
      prefix,
      includeExternalModuleExports: false,
      includeInsertTextCompletions: true,
      ...location,
    })
    return completions.body!.entries.map(
      completionEntryToSuggestion.bind(null, completions.body?.isMemberCompletion),
    )
  } else {
    // use deprecated completions
    const completions = await client.execute("completions", {
      prefix,
      includeExternalModuleExports: false,
      includeInsertTextCompletions: true,
      ...location,
    })

    return completions.body!.map(completionEntryToSuggestion.bind(null, undefined))
  }
}

// Decide what needs to be replaced in the editor buffer when inserting the completion
function getReplacementPrefix(
  opts: ACP.SuggestionsRequestedEvent,
  suggestion: SuggestionWithDetails,
): string {
  const line = opts.editor
    .getBuffer()
    .getTextInRange([[opts.bufferPosition.row, 0], opts.bufferPosition])
  if (suggestion.isMemberCompletion) {
    const dotMatch = line.match(/\.\s*?$/)
    if (dotMatch) return dotMatch[0].slice(1)
  }
  for (const i of inits(suggestion.displayText!.toLowerCase(), 1)) {
    if (line.toLowerCase().endsWith(i)) {
      return line.slice(-i.length)
    }
  }
  const {prefix} = opts
  const trimmed = prefix.trim()
  if (trimmed === "" || trimmed.match(/[\.{]$/)) {
    return ""
  } else if (suggestion.text.startsWith("$")) {
    return "$" + prefix
  } else {
    return prefix
  }
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
  }
}

function addCallableParens(s: SuggestionWithDetails): ACP.TextSuggestion | ACP.SnippetSuggestion {
  if (
    atom.config.get("atom-typescript.autocompleteParens") &&
    ["function", "method"].includes(s.leftLabel!)
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
