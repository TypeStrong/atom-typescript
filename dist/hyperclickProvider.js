"use strict";
const TS_GRAMMARS = new Set(["source.ts", "source.tsx"]);
exports.providerName = "typescript-hyperclick-provider";
exports.wordRegExp = /([A-Za-z0-9_])+|['"`](\\.|[^'"`\\\\])*['"`]/g;
function getSuggestionForWord(textEditor, text, range) {
    if (!TS_GRAMMARS.has(textEditor.getGrammar().scopeName)) {
        return null;
    }
    return {
        range: range,
        callback() {
            // let filePathPosition = {
            //   filePath: textEditor.getPath(),
            //   position: atomUtils.getEditorPositionForBufferPosition(textEditor, range.start)
            // };
            // parent.getDefinitionsAtPosition(filePathPosition).then((res) => {
            //     if (res.definitions.length > 0) {
            //         let definition = res.definitions[0];
            //         atom.workspace.open(definition.filePath, {
            //             initialLine: definition.position.line,
            //             initialColumn: definition.position.col
            //         });
            //     }
            // });
        }
    };
}
exports.getSuggestionForWord = getSuggestionForWord;
