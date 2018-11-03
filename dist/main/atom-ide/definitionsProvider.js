"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../atom/utils");
function getDefinitionProvider(getClient) {
    return {
        priority: 0,
        grammarScopes: utils_1.typeScriptScopes(),
        wordRegExp: /([A-Za-z0-9_])+|['"`](\\.|[^'"`\\\\])*['"`]/g,
        async getDefinition(editor, position) {
            if (!utils_1.isTypescriptEditorWithPath(editor))
                return;
            const location = utils_1.getFilePathPosition(editor, position);
            if (!location)
                return;
            const client = await getClient(location.file);
            const result = await client.execute("definition", location);
            if (!result.body)
                return;
            if (result.body.length === 0)
                return;
            return {
                queryRange: undefined,
                definitions: result.body.map(fileSpanToDefinition),
            };
        },
    };
}
exports.getDefinitionProvider = getDefinitionProvider;
function fileSpanToDefinition(span) {
    const range = utils_1.spanToRange(span);
    return {
        path: span.file,
        position: range.start,
        range,
        language: "TypeScript",
    };
}
//# sourceMappingURL=definitionsProvider.js.map