"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const goToDeclaration_1 = require("../atom/commands/goToDeclaration");
const utils_1 = require("../atom/utils");
function getHyperclickProvider(getClient, histGoForward) {
    return {
        priority: 0,
        providerName: "typescript-hyperclick-provider",
        wordRegExp: /([A-Za-z0-9_])+|['"`](\\.|[^'"`\\\\])*['"`]/g,
        async getSuggestionForWord(editor, _text, range) {
            if (!utils_1.isTypescriptEditorWithPath(editor))
                return;
            const filePath = editor.getPath();
            if (filePath === undefined)
                return;
            return {
                range,
                callback: async () => {
                    const location = {
                        file: filePath,
                        line: range.start.row + 1,
                        offset: range.start.column + 1,
                    };
                    const client = await getClient(location.file);
                    const result = await client.execute("definition", location);
                    await goToDeclaration_1.handleDefinitionResult(result, editor, histGoForward);
                },
            };
        },
    };
}
exports.getHyperclickProvider = getHyperclickProvider;
//# sourceMappingURL=hyperclickProvider.js.map