"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
class CodeActionsProvider {
    constructor(codefixProvider) {
        this.codefixProvider = codefixProvider;
        this.grammarScopes = ["source.ts", "source.tsx"];
        this.priority = 0;
    }
    getCodeActions(textEditor, range, diagnostics) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return this.codefixProvider.runCodeFix(textEditor, range.start, fix => ({
                getTitle: () => tslib_1.__awaiter(this, void 0, void 0, function* () { return fix.description; }),
                dispose: () => { },
                apply: () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield this.codefixProvider.applyFix(fix);
                }),
            }));
        });
    }
}
exports.CodeActionsProvider = CodeActionsProvider;
//# sourceMappingURL=codeActionsProvider.js.map