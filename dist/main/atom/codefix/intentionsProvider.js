"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../utils");
function getIntentionsProvider(codefixProvider) {
    return {
        grammarScopes: ["*"],
        async getIntentions({ bufferPosition, textEditor }) {
            return (await codefixProvider.runCodeFix(textEditor, bufferPosition)).map(fix => ({
                priority: 100,
                title: fix.description,
                selected: () => {
                    utils_1.handlePromise(codefixProvider.applyFix(fix));
                },
            }));
        },
    };
}
exports.getIntentionsProvider = getIntentionsProvider;
function getIntentionsHighlightsProvider(codefixProvider) {
    return {
        grammarScopes: ["*"],
        async getIntentions({ visibleRange, textEditor }) {
            return (await codefixProvider.getFixableRanges(textEditor, visibleRange)).map(range => ({
                range,
                created: (_opts) => {
                    // NOOP
                },
            }));
        },
    };
}
exports.getIntentionsHighlightsProvider = getIntentionsHighlightsProvider;
//# sourceMappingURL=intentionsProvider.js.map