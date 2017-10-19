"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
class IntentionsProvider {
    constructor(codefixProvider) {
        this.codefixProvider = codefixProvider;
        this.grammarScopes = ["*"];
    }
    getIntentions({ bufferPosition, textEditor }) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return (yield this.codefixProvider.runCodeFix(textEditor, bufferPosition)).map(fix => ({
                priority: 100,
                title: fix.description,
                selected: () => {
                    this.codefixProvider.applyFix(fix);
                },
            }));
        });
    }
}
exports.IntentionsProvider = IntentionsProvider;
//# sourceMappingURL=intentionsProvider.js.map