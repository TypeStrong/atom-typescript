"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class IntentionsProvider {
    constructor(codefixProvider) {
        this.codefixProvider = codefixProvider;
        this.grammarScopes = ["*"];
    }
    async getIntentions({ bufferPosition, textEditor, }) {
        return (await this.codefixProvider.runCodeFix(textEditor, bufferPosition)).map(fix => ({
            priority: 100,
            title: fix.description,
            selected: () => {
                this.codefixProvider.applyFix(fix);
            },
        }));
    }
}
exports.IntentionsProvider = IntentionsProvider;
//# sourceMappingURL=intentionsProvider.js.map