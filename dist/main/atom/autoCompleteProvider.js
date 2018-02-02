"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const Atom = require("atom");
const fuzzaldrin = require("fuzzaldrin");
const importPathScopes = ["meta.import", "meta.import-equals", "triple-slash-directive"];
class AutocompleteProvider {
    constructor(clientResolver, opts) {
        this.selector = ".source.ts, .source.tsx";
        this.disableForSelector = ".comment";
        this.inclusionPriority = 3;
        this.suggestionPriority = atom.config.get("atom-typescript.autocompletionSuggestionPriority");
        this.excludeLowerPriority = false;
        this.clientResolver = clientResolver;
        this.opts = opts;
    }
    // Try to reuse the last completions we got from tsserver if they're for the same position.
    async getSuggestionsWithCache(prefix, location, activatedManually) {
        if (this.lastSuggestions && !activatedManually) {
            const lastLoc = this.lastSuggestions.location;
            const lastCol = getNormalizedCol(this.lastSuggestions.prefix, lastLoc.offset);
            const thisCol = getNormalizedCol(prefix, location.offset);
            if (lastLoc.file === location.file && lastLoc.line === location.line && lastCol === thisCol) {
                if (this.lastSuggestions.suggestions.length !== 0) {
                    return this.lastSuggestions.suggestions;
                }
            }
        }
        const client = await this.clientResolver.get(location.file);
        const completions = await client.executeCompletions(Object.assign({ prefix, includeExternalModuleExports: false }, location));
        const suggestions = completions.body.map(entry => ({
            text: entry.name,
            leftLabel: entry.kind,
            type: utils_1.kindToType(entry.kind),
        }));
        this.lastSuggestions = {
            client,
            location,
            prefix,
            suggestions,
        };
        return suggestions;
    }
    async getSuggestions(opts) {
        const location = getLocationQuery(opts);
        const { prefix } = opts;
        if (!location) {
            return [];
        }
        // Don't show autocomplete if the previous character was a non word character except "."
        const lastChar = getLastNonWhitespaceChar(opts.editor.buffer, opts.bufferPosition);
        if (lastChar && !opts.activatedManually) {
            if (/\W/i.test(lastChar) && lastChar !== ".") {
                return [];
            }
        }
        // Don't show autocomplete if we're in a string.template and not in a template expression
        if (containsScope(opts.scopeDescriptor.scopes, "string.template.") &&
            !containsScope(opts.scopeDescriptor.scopes, "template.expression.")) {
            return [];
        }
        // Don't show autocomplete if we're in a string and it's not an import path
        if (containsScope(opts.scopeDescriptor.scopes, "string.quoted.")) {
            if (!importPathScopes.some(scope => containsScope(opts.scopeDescriptor.scopes, scope))) {
                return [];
            }
        }
        // Flush any pending changes for this buffer to get up to date completions
        const { buffer } = await this.opts.getTypescriptBuffer(location.file);
        await buffer.flush();
        try {
            let suggestions = await this.getSuggestionsWithCache(prefix, location, opts.activatedManually);
            const alphaPrefix = prefix.replace(/\W/g, "");
            if (alphaPrefix !== "") {
                suggestions = fuzzaldrin.filter(suggestions, alphaPrefix, {
                    key: "text",
                });
            }
            // Get additional details for the first few suggestions
            await this.getAdditionalDetails(suggestions.slice(0, 10), location);
            const trimmed = prefix.trim();
            return suggestions.map(suggestion => (Object.assign({ replacementPrefix: getReplacementPrefix(prefix, trimmed, suggestion.text) }, suggestion)));
        }
        catch (error) {
            return [];
        }
    }
    async getAdditionalDetails(suggestions, location) {
        if (suggestions.some(s => !s.details)) {
            const details = await this.lastSuggestions.client.executeCompletionDetails(Object.assign({ entryNames: suggestions.map(s => s.text) }, location));
            details.body.forEach((detail, i) => {
                const suggestion = suggestions[i];
                suggestion.details = detail;
                let parts = detail.displayParts;
                if (parts[1] &&
                    parts[1].text === suggestion.leftLabel &&
                    parts[0] &&
                    parts[0].text === "(" &&
                    parts[2] &&
                    parts[2].text === ")") {
                    parts = parts.slice(3);
                }
                suggestion.rightLabel = parts.map(d => d.text).join("");
                if (detail.documentation) {
                    suggestion.description = detail.documentation.map(d => d.text).join(" ");
                }
            });
        }
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
function getNormalizedCol(prefix, col) {
    const length = prefix === "." ? 0 : prefix.length;
    return col - length;
}
function getLocationQuery(opts) {
    const path = opts.editor.getPath();
    if (!path) {
        return undefined;
    }
    return {
        file: path,
        line: opts.bufferPosition.row + 1,
        offset: opts.bufferPosition.column + 1,
    };
}
function getLastNonWhitespaceChar(buffer, pos) {
    let lastChar;
    const range = new Atom.Range([0, 0], pos);
    buffer.backwardsScanInRange(/\S/, range, ({ matchText, stop }) => {
        lastChar = matchText;
        stop();
    });
    return lastChar;
}
function containsScope(scopes, matchScope) {
    for (const scope of scopes) {
        if (scope.includes(matchScope)) {
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=autoCompleteProvider.js.map