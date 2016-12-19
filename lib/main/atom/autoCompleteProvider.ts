// more: https://github.com/atom-community/autocomplete-plus/wiki/Provider-API
import {ClientResolver} from "../../client/clientResolver"
import {kindToType} from "./atomUtils"
import {Provider, RequestOptions, Suggestion} from "../../typings/autocomplete"
import {TypescriptServiceClient} from "../../client/client"
import * as fuzzaldrin from "fuzzaldrin"

type FileLocationQuery = {
  file: string
  line: number
  offset: number
}

type SuggestionWithDetails = Suggestion & {details?}

export class AutocompleteProvider implements Provider {
  selector = ".source.ts, .source.tsx"
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
    if (this.lastSuggestions) {
      const lastLoc = this.lastSuggestions.location
      const lastCol = getNormalizedCol(this.lastSuggestions.prefix, lastLoc.offset)
      const thisCol = getNormalizedCol(prefix, location.offset)

      if (lastLoc.file === location.file && lastLoc.line == location.line && lastCol === thisCol) {
        return this.lastSuggestions.suggestions
      }
    }

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

    console.warn(JSON.stringify(prefix))

    if (!location.file) {
      return []
    }

    let suggestions = await this.getSuggestionsWithCache(prefix, location)

    const alphaPrefix = prefix.replace(/\W/g, "")
    if (alphaPrefix !== "") {
      suggestions = fuzzaldrin.filter(suggestions, alphaPrefix, {key: "text"})
    }

    // Get additional details for the first few suggestions, but don't wait for it to complete
    this.getAdditionalDetails(suggestions.slice(0, 15), location)

    return suggestions
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

// export var provider: autocompleteplus.Provider = {
//     selector: '.source.ts, .source.tsx',
//     inclusionPriority: 3,
//     suggestionPriority: 3,
//     excludeLowerPriority: false,
//     getSuggestions: async function (options: autocompleteplus.RequestOptions): Promise<autocompleteplus.Suggestion[]> {
//
//         const filePath = options.editor.getPath()
//
//         // We refuse to work on files that are not on disk.
//         if (!filePath || !fs.existsSync(filePath))
//           return [];
//
//         const client = await clientResolver.get(filePath)
//
//         // var {isReference, isRequire, isImport} = getModuleAutocompleteType(options.scopeDescriptor.scopes)
//         //
//         // // For file path completions
//         // if (isReference || isRequire || isImport) {
//         //     return parent.getRelativePathsInProject({ filePath, prefix: options.prefix, includeExternalModules: isReference })
//         //         .then((resp) => {
//         //
//         //         var range = options.editor.bufferRangeForScopeAtCursor(".string.quoted")
//         //         var cursor = options.editor.getCursorBufferPosition()
//         //
//         //         // Check if we're in a string and if the cursor is at the end of it. Bail otherwise
//         //         if (!range || cursor.column !== range.end.column-1) {
//         //           return []
//         //         }
//         //
//         //         var content = options.editor.getTextInBufferRange(range).replace(/^['"]|['"]$/g, "")
//         //
//         //         return resp.files.map(file => {
//         //             var relativePath = file.relativePath;
//         //
//         //             /** Optionally customize this in future */
//         //             var suggestionText = relativePath;
//         //
//         //             var suggestion: autocompleteplus.Suggestion = {
//         //                 text: suggestionText,
//         //                 replacementPrefix: content,
//         //                 rightLabelHTML: '<span>' + file.name + '</span>',
//         //                 type: 'import'
//         //             };
//         //
//         //             return suggestion;
//         //         });
//         //     });
//         // }
//         // else {
//
//             // if explicitly triggered reset the explicit nature
//         if (explicitlyTriggered) {
//             explicitlyTriggered = false;
//         }
//         else { // else in special cases for automatic triggering refuse to provide completions
//             const prefix = options.prefix.trim()
//
//             if (prefix === '' || prefix === ';' || prefix === '{') {
//                 return Promise.resolve([]);
//             }
//         }
//
//         return client.executeCompletions({
//             file: filePath,
//             prefix: options.prefix,
//             line: options.bufferPosition.row+1,
//             offset: options.bufferPosition.column+1
//         }).then(resp => {
//             console.log("prefix", options.prefix)
//             return resp.body.map(c => {
//
//                 // if (c.snippet) // currently only function completions are snippet
//                 // {
//                 //     return {
//                 //         snippet: c.snippet,
//                 //         replacementPrefix: '',
//                 //         rightLabel: 'signature',
//                 //         type: 'snippet',
//                 //     };
//                 // }
//                 // else {
//                     var prefix = options.prefix;
//
//                     // If the completion is $foo
//                     // The prefix from acp is actually only `foo`
//                     // But the var is $foo
//                     // => so we would potentially end up replacing $foo with $$foo
//                     // Fix that:
//                     if (c.name && c.name.startsWith('$')) {
//                         prefix = "$" + prefix;
//                     }
//
//                     return {
//                         text: c.name,
//                         replacementPrefix: prefix === "." ? "" : prefix.trim(),
//                         rightLabel: c.name,
//                         leftLabel: c.kind,
//                         type: atomUtils.kindToType(c.kind),
//                         description: null,
//                     };
//                 // }
//               });
//           }).catch(() => [])
//     },
// }
