"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../atom/utils");
function getFindReferencesProvider(getClient) {
    return {
        async isEditorSupported(editor) {
            return utils_1.isTypescriptEditorWithPath(editor);
        },
        async findReferences(editor, position) {
            const location = utils_1.getFilePathPosition(editor, position);
            if (!location)
                return;
            const client = await getClient(location.file);
            const result = await client.execute("references", location);
            if (!result.body)
                return;
            return {
                type: "data",
                baseUri: location.file,
                referencedSymbolName: result.body.symbolDisplayString,
                references: result.body.refs.map(refTsToIde),
            };
        },
    };
}
exports.getFindReferencesProvider = getFindReferencesProvider;
function refTsToIde(ref) {
    return {
        uri: ref.file,
        range: utils_1.locationsToRange(ref.start, ref.end),
        name: undefined,
    };
}
//# sourceMappingURL=findReferencesProvider.js.map