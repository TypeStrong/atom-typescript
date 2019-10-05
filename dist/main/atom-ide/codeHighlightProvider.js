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
            const result = await client.execute("documentHighlights", Object.assign(Object.assign({}, location), { filesToSearch: [location.file] }));
            if (!result.body)
                return;
            return Array.from(getSpans(location.file, result.body));
        },
    };
}
exports.getCodeHighlightProvider = getCodeHighlightProvider;
function* getSpans(file, data) {
    for (const fileInfo of data) {
        if (fileInfo.file !== file)
            continue;
        yield* fileInfo.highlightSpans.map(utils_1.spanToRange);
    }
}
//# sourceMappingURL=codeHighlightProvider.js.map