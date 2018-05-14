"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
class CodeActionsProvider {
    constructor(codefixProvider) {
        this.codefixProvider = codefixProvider;
        this.grammarScopes = utils_1.typeScriptScopes();
        this.priority = 0;
    }
    async getCodeActions(textEditor, range, _diagnostics) {
        return (await this.codefixProvider.runCodeFix(textEditor, range.start)).map(fix => ({
            getTitle: async () => fix.description,
            dispose: () => { },
            apply: async () => {
                await this.codefixProvider.applyFix(fix);
            },
        }));
    }
}
exports.CodeActionsProvider = CodeActionsProvider;
//# sourceMappingURL=codeActionsProvider.js.map