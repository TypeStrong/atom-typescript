"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutocompleteProvider = void 0;
// more: https://github.com/atom-community/autocomplete-plus/wiki/Provider-API
const Atom = require("atom");
const fuzzaldrin = require("fuzzaldrin");
const utils_1 = require("./utils");
class AutocompleteProvider {
    constructor(getClient) {
        this.getClient = getClient;
        this.selector = utils_1.typeScriptScopes()
            .map((x) => (x.includes(".") ? `.${x}` : x))
            .join(", ");
        this.disableForSelector = ".comment";
        this.inclusionPriority = 3;
        this.suggestionPriority = atom.config.get("atom-typescript").autocompletionSuggestionPriority;
        this.excludeLowerPriority = false;
    }
    async getSuggestions(opts) {
        const location = getLocationQuery(opts);
        const prefix = getPrefix(opts);
        if (!location)
            return [];
        // Don't auto-show autocomplete if prefix is empty unless last character is '.'
        if (!prefix && !opts.activatedManually) {
            const lastChar = getLastNonWhitespaceChar(opts.editor.getBuffer(), opts.bufferPosition);
            if (lastChar !== ".")
                return [];
        }
        // Don't show autocomplete if we're in a string.template and not in a template expression
        if (containsScope(opts.scopeDescriptor.getScopesArray(), "string.template.") &&
            !containsScope(opts.scopeDescriptor.getScopesArray(), "template.expression.")) {
            return [];
        }
        try {
            let suggestions = await this.getSuggestionsWithCache(prefix, location, opts.activatedManually);
            suggestions = fuzzaldrin.filter(suggestions, prefix, {
                key: "displayText",
            });
            // Get additional details for the first few suggestions
            // don't wait for additional detail
            this.getAdditionalDetails(suggestions.slice(0, 10), location).catch(() => { });
            return suggestions.map((suggestion) => (Object.assign({ replacementPrefix: suggestion.replacementRange
                    ? opts.editor.getTextInBufferRange(suggestion.replacementRange)
                    : prefix }, addCallableParens(opts, suggestion))));
        }
        catch (error) {
            return [];
        }
    }
    async getAdditionalDetails(suggestions, location) {
        if (this.lastSuggestions && suggestions.some((s) => !s.details)) {
            const details = await this.lastSuggestions.client.execute("completionEntryDetails", Object.assign({ entryNames: suggestions.map((s) => s.displayText) }, location));
            details.body.forEach((detail, i) => {
                const suggestion = suggestions[i];
                suggestion.details = detail;
                let parts = detail.displayParts;
                if (parts.length >= 3 &&
                    parts[0].text === "(" &&
                    parts[1].text === suggestion.leftLabel &&
                    parts[2].text === ")") {
                    parts = parts.slice(3);
                }
                suggestion.rightLabel = parts.map((d) => d.text).join("");
                suggestion.description =
                    detail.documentation && detail.documentation.map((d) => d.text).join(" ");
            });
        }
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
        const client = await this.getClient(location.file);
        const suggestions = await getSuggestionsInternal(client, location, prefix);
        this.lastSuggestions = {
            client,
            location,
            prefix,
            suggestions,
        };
        return suggestions;
    }
}
exports.AutocompleteProvider = AutocompleteProvider;
async function getSuggestionsInternal(client, location, prefix) {
    var _a;
    if (parseInt(client.version.split(".")[0], 10) >= 3) {
        // use completionInfo
        const completions = await client.execute("completionInfo", Object.assign({ prefix, includeExternalModuleExports: false, includeInsertTextCompletions: true }, location));
        return completions.body.entries.map(completionEntryToSuggestion.bind(null, (_a = completions.body) === null || _a === void 0 ? void 0 : _a.isMemberCompletion));
    }
    else {
        // use deprecated completions
        const completions = await client.execute("completions", Object.assign({ prefix, includeExternalModuleExports: false, includeInsertTextCompletions: true }, location));
        return completions.body.map(completionEntryToSuggestion.bind(null, undefined));
    }
}
// this should more or less match ES6 specification for valid identifiers
const identifierMatch = /(?:(?![\u{10000}-\u{10FFFF}])[\$_\p{Lu}\p{Ll}\p{Lt}\p{Lm}\p{Lo}\p{Nl}])(?:(?![\u{10000}-\u{10FFFF}])[\$_\p{Lu}\p{Ll}\p{Lt}\p{Lm}\p{Lo}\p{Nl}\u200C\u200D\p{Mn}\p{Mc}\p{Nd}\p{Pc}])*$/u;
// Decide what needs to be replaced in the editor buffer when inserting the completion
function getPrefix(opts) {
    // see https://github.com/TypeStrong/atom-typescript/issues/1528
    // for the motivating example.
    const line = opts.editor
        .getBuffer()
        .getTextInRange([[opts.bufferPosition.row, 0], opts.bufferPosition]);
    const idMatch = line.match(identifierMatch);
    if (idMatch)
        return idMatch[0];
    else
        return "";
}
// When the user types each character in ".hello", we want to normalize the column such that it's
// the same for every invocation of the getSuggestions. In this case, it would be right after "."
function getNormalizedCol(prefix, col) {
    const length = prefix === "." ? 0 : prefix.length;
    return col - length;
}
function getLocationQuery(opts) {
    const path = opts.editor.getPath();
    if (path === undefined) {
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
function completionEntryToSuggestion(isMemberCompletion, entry) {
    return {
        displayText: entry.name,
        text: entry.insertText !== undefined ? entry.insertText : entry.name,
        leftLabel: entry.kind,
        replacementRange: entry.replacementSpan ? utils_1.spanToRange(entry.replacementSpan) : undefined,
        type: kindMap[entry.kind],
        isMemberCompletion,
    };
}
function parens(opts) {
    const buffer = opts.editor.getBuffer();
    const pt = opts.bufferPosition;
    const lookahead = buffer.getTextInRange([pt, [pt.row, buffer.lineLengthForRow(pt.row)]]);
    return !!lookahead.match(/\s*\(/);
}
function addCallableParens(opts, s) {
    if (atom.config.get("atom-typescript.autocompleteParens") &&
        ["function", "method"].includes(s.leftLabel) &&
        !parens(opts)) {
        return Object.assign(Object.assign({}, s), { snippet: `${s.text}($1)`, text: undefined });
    }
    else
        return s;
}
const kindMap = {
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
};
//# sourceMappingURL=autoCompleteProvider.js.map