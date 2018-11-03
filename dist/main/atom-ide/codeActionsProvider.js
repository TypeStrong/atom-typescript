"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../atom/utils");
function getCodeActionsProvider(codefixProvider) {
    return {
        grammarScopes: utils_1.typeScriptScopes(),
        priority: 0,
        async getCodeActions(textEditor, range, _diagnostics) {
            return (await codefixProvider.runCodeFix(textEditor, range.start)).map(fix => ({
                getTitle: async () => fix.description,
                dispose: () => { },
                apply: async () => {
                    await codefixProvider.applyFix(fix);
                },
            }));
        },
    };
}
exports.getCodeActionsProvider = getCodeActionsProvider;
//# sourceMappingURL=codeActionsProvider.js.map