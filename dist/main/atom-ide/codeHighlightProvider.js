"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../atom/utils");
function getCodeHighlightProvider(getClient) {
    return {
        grammarScopes: utils_1.typeScriptScopes(),
        priority: 100,
        async highlight(editor, position) {
            if (!utils_1.isTypescriptEditorWithPath(editor))
                return;
            const location = utils_1.getFilePathPosition(editor, position);
            if (!location)
                return;
            const client = await getClient(location.file);
            const result = await client.execute("occurrences", location);
            if (!result.body)
                return;
            return result.body.map(utils_1.spanToRange);
        },
    };
}
exports.getCodeHighlightProvider = getCodeHighlightProvider;
//# sourceMappingURL=codeHighlightProvider.js.map