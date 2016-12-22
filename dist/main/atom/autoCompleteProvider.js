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
    getSuggestionsWithCache(prefix, location) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
function getReplacementPrefix(prefix, trimmed, replacement) {
    if (trimmed === "." || trimmed === "{") {
        return "";
    }
    else if (replacement.startsWith("$")) {
        return "$" + prefix;
    }
    else {
        return prefix;
    }
}
function getLocationQuery(opts) {
    return {
        file: opts.editor.getPath(),
        line: opts.bufferPosition.row + 1,
        offset: opts.bufferPosition.column + 1
    };
}
