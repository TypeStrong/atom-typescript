"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const findReferences_1 = require("../atom/commands/findReferences");
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
                    var _a, _b, _c;
                    const location = {
                        file: filePath,
                        line: range.start.row + 1,
                        offset: range.start.column + 1,
                    };
                    const client = await getClient(location.file);
                    const result = await client.execute("definition", location);
                    const resLoc = result.body ? result.body[0] : undefined;
                    if (((_a = result.body) === null || _a === void 0 ? void 0 : _a.length) === 1 &&
                        ((_b = resLoc) === null || _b === void 0 ? void 0 : _b.start.line) === location.line &&
                        ((_c = resLoc) === null || _c === void 0 ? void 0 : _c.start.offset) === location.offset) {
                        const references = await client.execute("references", location);
                        await findReferences_1.handleFindReferencesResult(references, editor, histGoForward);
                    }
                    else {
                        await goToDeclaration_1.handleDefinitionResult(result, editor, histGoForward);
                    }
                },
            };
        },
    };
}
exports.getHyperclickProvider = getHyperclickProvider;
//# sourceMappingURL=hyperclickProvider.js.map