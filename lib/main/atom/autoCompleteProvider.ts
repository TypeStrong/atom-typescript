// more: https://github.com/atom-community/autocomplete-plus/wiki/Provider-API
import {ClientResolver} from "../../client/clientResolver"
import {kindToType, FileLocationQuery} from "./atomUtils"
import {Provider, RequestOptions, Suggestion} from "../../typings/autocomplete"
import {TypescriptServiceClient} from "../../client/client"
import * as fuzzaldrin from "fuzzaldrin"

type SuggestionWithDetails = Suggestion & {details?}

export class AutocompleteProvider implements Provider {
  selector = ".source.ts, .source.tsx"
  disableForSelector = ".comment.block.documentation.ts, .comment.block.documentation.tsx, .comment.line.double-slash.ts, .comment.line.double-slash.tsx"

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

  constructor(clientResolver: ClientResolver) {
    this.clientResolver = clientResolver
  }

  // Try to reuse the last completions we got from tsserver if they're for the same position.
  async getSuggestionsWithCache(
    prefix: string,
    location: FileLocationQuery
  ): Promise<SuggestionWithDetails[]> {
    // NOTE: While typing this can get out of sync with what tsserver would return so find a better
    // way to reuse the completions.
    // if (this.lastSuggestions) {
    //   const lastLoc = this.lastSuggestions.location
    //   const lastCol = getNormalizedCol(this.lastSuggestions.prefix, lastLoc.offset)
    //   const thisCol = getNormalizedCol(prefix, location.offset)
    //
    //   if (lastLoc.file === location.file && lastLoc.line == location.line && lastCol === thisCol) {
    //     if (this.lastSuggestions.suggestions.length !== 0) {
    //       return this.lastSuggestions.suggestions
    //     }
    //   }
    // }

    const client = await this.clientResolver.get(location.file)
    const completions = await client.executeCompletions({prefix, ...location})

    const suggestions = completions.body.map(entry => ({
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

    console.log("autocomplete", {prefix, location})

    if (!location.file) {
      return []
    }

    try {
      var suggestions = await this.getSuggestionsWithCache(prefix, location)
    } catch (error) {
      return []
    }

    const alphaPrefix = prefix.replace(/\W/g, "")
    if (alphaPrefix !== "") {
      suggestions = fuzzaldrin.filter(suggestions, alphaPrefix, {key: "text"})
    }

    // Get additional details for the first few suggestions, but don't wait for it to complete
    this.getAdditionalDetails(suggestions.slice(0, 15), location)

    return suggestions.map(suggestion => ({
      replacementPrefix: getReplacementPrefix(prefix, suggestion.text),
      ...suggestion
    }))
  }

  async getAdditionalDetails(suggestions: SuggestionWithDetails[], location: FileLocationQuery) {
    if (suggestions.some(s => !s.details)) {
      const details = await this.lastSuggestions.client.executeCompletionDetails({
        entryNames: suggestions.map(s => s.text),
        ...location
      })

      details.body.forEach((detail, i) => {
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

// If prefix is ".", don't replace anything, just insert the completion, replace it otherwise.
function getReplacementPrefix(prefix: string, replacement: string): string {
  if (prefix === ".") {
    return ""
  } else if (replacement.startsWith("$")) {
    return "$" + prefix
  } else {
    return prefix
  }
}

// When the user types each character in ".hello", we want to normalize the column such that it's
// the same for every invocation of the getSuggestions. In this case, it would be right after "."
// function getNormalizedCol(prefix: string, col: number): number {
//   const length = prefix === "." ? 0 : prefix.length
//   return col - length
// }

function getLocationQuery(opts: RequestOptions): FileLocationQuery {
  return {
    file: opts.editor.getPath(),
    line: opts.bufferPosition.row+1,
    offset: opts.bufferPosition.column+1
  }
}
