"use strict";
var TS_GRAMMARS = new Set(["source.ts", "source.tsx"]);
exports.providerName = "typescript-hyperclick-provider";
exports.wordRegExp = /([A-Za-z0-9_])+|['"`](\\.|[^'"`\\\\])*['"`]/g;
function getSuggestionForWord(textEditor, text, range) {
    if (!TS_GRAMMARS.has(textEditor.getGrammar().scopeName)) {
        return null;
    }
    return {
        range: range,
        callback: function () {
        }
    };
}
exports.getSuggestionForWord = getSuggestionForWord;
