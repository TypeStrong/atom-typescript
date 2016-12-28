"use strict";
const tslib_1 = require("tslib");
const atomUtils_1 = require("./atomUtils");
const fuzzaldrin = require("fuzzaldrin");
class AutocompleteProvider {
    constructor(clientResolver) {
        this.selector = ".source.ts, .source.tsx";
        this.disableForSelector = ".comment.block.documentation.ts, .comment.block.documentation.tsx, .comment.line.double-slash.ts, .comment.line.double-slash.tsx";
        this.inclusionPriority = 3;
        this.suggestionPriority = 3;
        this.excludeLowerPriority = false;
        this.clientResolver = clientResolver;
    }
    // Try to reuse the last completions we got from tsserver if they're for the same position.
    getSuggestionsWithCache(prefix, location) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
            const client = yield this.clientResolver.get(location.file);
            const completions = yield client.executeCompletions(tslib_1.__assign({ prefix }, location));
            const suggestions = completions.body.map(entry => ({
                text: entry.name,
                leftLabel: entry.kind,
                type: atomUtils_1.kindToType(entry.kind),
            }));
            this.lastSuggestions = {
                client,
                location,
                prefix,
                suggestions,
            };
            return suggestions;
        });
    }
    getSuggestions(opts) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const location = getLocationQuery(opts);
            const { prefix } = opts;
            console.log("autocomplete", { prefix, location });
            if (!location.file) {
                return [];
            }
            try {
                var suggestions = yield this.getSuggestionsWithCache(prefix, location);
            }
            catch (error) {
                return [];
            }
            const alphaPrefix = prefix.replace(/\W/g, "");
            if (alphaPrefix !== "") {
                suggestions = fuzzaldrin.filter(suggestions, alphaPrefix, { key: "text" });
            }
            // Get additional details for the first few suggestions, but don't wait for it to complete
            this.getAdditionalDetails(suggestions.slice(0, 15), location);
            const trimmed = prefix.trim();
            return suggestions.map(suggestion => (tslib_1.__assign({ replacementPrefix: getReplacementPrefix(prefix, trimmed, suggestion.text) }, suggestion)));
        });
    }
    getAdditionalDetails(suggestions, location) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (suggestions.some(s => !s.details)) {
                const details = yield this.lastSuggestions.client.executeCompletionDetails(tslib_1.__assign({ entryNames: suggestions.map(s => s.text) }, location));
                details.body.forEach((detail, i) => {
                    const suggestion = suggestions[i];
                    suggestion.details = detail;
                    suggestion.rightLabel = detail.displayParts.map(d => d.text).join("");
                    if (detail.documentation) {
                        suggestion.description = detail.documentation.map(d => d.text).join(" ");
                    }
                });
            }
        });
    }
}
exports.AutocompleteProvider = AutocompleteProvider;
// Decide what needs to be replaced in the editor buffer when inserting the completion
function getReplacementPrefix(prefix, trimmed, replacement) {
    if (trimmed === "." || trimmed === "{" || prefix === " ") {
        return "";
    }
    else if (replacement.startsWith("$")) {
        return "$" + prefix;
    }
    else {
        return prefix;
    }
}
// When the user types each character in ".hello", we want to normalize the column such that it's
// the same for every invocation of the getSuggestions. In this case, it would be right after "."
// function getNormalizedCol(prefix: string, col: number): number {
//   const length = prefix === "." ? 0 : prefix.length
//   return col - length
// }
function getLocationQuery(opts) {
    return {
        file: opts.editor.getPath(),
        line: opts.bufferPosition.row + 1,
        offset: opts.bufferPosition.column + 1
    };
}
