"use strict";
var parent = require("./worker/parent");
var atomUtils = require("./main/atom/atomUtils");
var immutable_1 = require("immutable");
var TS_GRAMMARS = immutable_1.Set(["source.ts", "source.tsx"]);
exports.providerName = "typescript-hyperclick-provider";
exports.wordRegExp = /([A-Za-z0-9_])+|['"`](\\.|[^'"`\\\\])*['"`]/g;
function getSuggestionForWord(textEditor, text, range) {
    if (!TS_GRAMMARS.has(textEditor.getGrammar().scopeName)) {
        return null;
    }
    return {
        range: range,
        callback: function () {
            var filePathPosition = {
                filePath: textEditor.getPath(),
                position: atomUtils.getEditorPositionForBufferPosition(textEditor, range.start)
            };
            parent.getDefinitionsAtPosition(filePathPosition).then(function (res) {
                if (res.definitions.length > 0) {
                    var definition = res.definitions[0];
                    atom.workspace.open(definition.filePath, {
                        initialLine: definition.position.line,
                        initialColumn: definition.position.col
                    });
                }
            });
        }
    };
}
exports.getSuggestionForWord = getSuggestionForWord;
