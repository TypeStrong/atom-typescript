"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const goToDeclaration_1 = require("./commands/goToDeclaration");
const utils_1 = require("./utils");
function getHyperclickProvider(clientResolver, editorPosHist) {
    return {
        providerName: "typescript-hyperclick-provider",
        wordRegExp: /([A-Za-z0-9_])+|['"`](\\.|[^'"`\\\\])*['"`]/g,
        getSuggestionForWord(editor, _text, range) {
            if (!utils_1.isTypescriptEditorWithPath(editor)) {
                return null;
            }
            const filePath = editor.getPath();
            if (filePath === undefined) {
                return null;
            }
            return {
                range,
                callback: async () => {
                    const location = {
                        file: filePath,
                        line: range.start.row + 1,
                        offset: range.start.column + 1,
                    };
                    const client = await clientResolver.get(location.file);
                    const result = await client.execute("definition", location);
                    goToDeclaration_1.handleDefinitionResult(result, editor, editorPosHist);
                },
            };
        },
    };
}
exports.getHyperclickProvider = getHyperclickProvider;
//# sourceMappingURL=hyperclickProvider.js.map