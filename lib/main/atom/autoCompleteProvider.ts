// more: https://github.com/atom-community/autocomplete-plus/wiki/Provider-API
import {ClientResolver} from "../../client/clientResolver"
import {kindToType, FileLocationQuery} from "./utils"
import {Provider, RequestOptions, Suggestion} from "../../typings/autocomplete"
import {TypescriptBuffer} from "../typescriptBuffer"
import {TypescriptServiceClient} from "../../client/client"
import * as Atom from "atom"
import * as fuzzaldrin from "fuzzaldrin"

const importPathScopes = ["meta.import", "meta.import-equals", "triple-slash-directive"]

type SuggestionWithDetails = Suggestion & {
  details?: protocol.CompletionEntryDetails
}

type Options = {
  getTypescriptBuffer: (filePath: string) => Promise<{
    buffer: TypescriptBuffer
    isOpen: boolean
  }>
}

export class AutocompleteProvider implements Provider {
  selector = ".source.ts, .source.tsx"

  disableForSelector = ".comment"

  inclusionPriority = 3
  suggestionPriority = 3
  excludeLowerPriority = false

  private clientResolver: ClientResolver
  private lastSuggestions: {
    // Client used to get the suggestions
    client: TypescriptServiceClient

    // File and position for the suggestions
    location: FileLocationQuery

    // Prefix used
    prefix: string

    // The completions that were returned for the position
    suggestions: SuggestionWithDetails[]
  }

  private opts: Options

  constructor(clientResolver: ClientResolver, opts: Options) {
    this.clientResolver = clientResolver
    this.opts = opts
  }

  // Try to reuse the last completions we got from tsserver if they're for the same position.
  async getSuggestionsWithCache(
    prefix: string,
    location: FileLocationQuery,
    activatedManually: boolean,
  ): Promise<SuggestionWithDetails[]> {
    if (this.lastSuggestions && !activatedManually) {
      const lastLoc = this.lastSuggestions.location
      const lastCol = getNormalizedCol(this.lastSuggestions.prefix, lastLoc.offset)
      const thisCol = getNormalizedCol(prefix, location.offset)

      if (lastLoc.file === location.file && lastLoc.line == location.line && lastCol === thisCol) {
        if (this.lastSuggestions.suggestions.length !== 0) {
          return this.lastSuggestions.suggestions
        }
      }
    }

    const client = await this.clientResolver.get(location.file)
    const completions = await client.executeCompletions({prefix, ...location})

    const suggestions = completions.body!.map(entry => ({
      text: entry.name,
      leftLabel: entry.kind,
      type: kindToType(entry.kind),
    }))

    this.lastSuggestions = {
      client,
      location,
      prefix,
      suggestions,
    }

    return suggestions
  }

  async getSuggestions(opts: RequestOptions): Promise<Suggestion[]> {
    const location = getLocationQuery(opts)
    const {prefix} = opts

    if (!location.file) {
      return []
    }

    // Don't show autocomplete if the previous character was a non word character except "."
    const lastChar = getLastNonWhitespaceChar(opts.editor.buffer, opts.bufferPosition)
    if (lastChar && !opts.activatedManually) {
      if (/\W/i.test(lastChar) && lastChar !== ".") {
        return []
      }
    }

    // Don't show autocomplete if we're in a string.template and not in a template expression
    if (containsScope(opts.scopeDescriptor.scopes, "string.template.")
      && !containsScope(opts.scopeDescriptor.scopes, "template.expression.")) {
        return []
    }

    // Don't show autocomplete if we're in a string and it's not an import path
    if (containsScope(opts.scopeDescriptor.scopes, "string.quoted.")) {
      if (!importPathScopes.some(scope => containsScope(opts.scopeDescriptor.scopes, scope))) {
        return []
      }
    }

    // Flush any pending changes for this buffer to get up to date completions
    const {buffer} = await this.opts.getTypescriptBuffer(location.file)
    await buffer.flush()

    try {
      var suggestions = await this.getSuggestionsWithCache(prefix, location, opts.activatedManually)
    } catch (error) {
      return []
    }

    const alphaPrefix = prefix.replace(/\W/g, "")
    if (alphaPrefix !== "") {
      suggestions = fuzzaldrin.filter(suggestions, alphaPrefix, {key: "text"})
    }

    // Get additional details for the first few suggestions
    await this.getAdditionalDetails(suggestions.slice(0, 10), location)

    const trimmed = prefix.trim()

    return suggestions.map(suggestion => ({
      replacementPrefix: getReplacementPrefix(prefix, trimmed, suggestion.text!),
      ...suggestion
    }))
  }

  async getAdditionalDetails(suggestions: SuggestionWithDetails[], location: FileLocationQuery) {
    if (suggestions.some(s => !s.details)) {
      const details = await this.lastSuggestions.client.executeCompletionDetails({
        entryNames: suggestions.map(s => s.text!),
        ...location
      })

      details.body!.forEach((detail, i) => {
        const suggestion = suggestions[i]

        suggestion.details = detail
        suggestion.rightLabel = detail.displayParts.map(d => d.text).join("")

        if (detail.documentation) {
          suggestion.description = detail.documentation.map(d => d.text).join(" ")
        }
      })
    }
  }
}

// Decide what needs to be replaced in the editor buffer when inserting the completion
function getReplacementPrefix(prefix: string, trimmed: string, replacement: string): string {
  if (trimmed === "." || trimmed === "{" || prefix === " ") {
    return ""
  } else if (replacement.startsWith("$")) {
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

function getLocationQuery(opts: RequestOptions): FileLocationQuery {
  return {
    file: opts.editor.getPath(),
    line: opts.bufferPosition.row+1,
    offset: opts.bufferPosition.column+1
  }
}

function getLastNonWhitespaceChar(buffer: TextBuffer.ITextBuffer, pos: TextBuffer.IPoint): string | undefined {
  let lastChar: string | undefined = undefined
  const range = new Atom.Range([0,0], pos)
  buffer.backwardsScanInRange(/\S/, range, ({matchText, stop}: {matchText: string, stop: () => void}) => {
      lastChar = matchText
      stop()
    })
  return lastChar
}

function containsScope(scopes: string[], matchScope: string): boolean {
  for (const scope of scopes) {
    if (scope.includes(matchScope)) {
      return true
    }
  }

  return false
}
