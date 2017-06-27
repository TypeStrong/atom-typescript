"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const utils_1 = require("./utils");
class CodefixProvider {
    constructor(clientResolver) {
        this.grammarScopes = ["*"];
        this.supportedFixes = new WeakMap();
        this.clientResolver = clientResolver;
    }
    getIntentions({ bufferPosition, textEditor }) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const filePath = textEditor.getPath();
            if (!filePath || !this.errorPusher || !this.clientResolver || !this.getTypescriptBuffer) {
                return [];
            }
            const client = yield this.clientResolver.get(filePath);
            const supportedCodes = yield this.getSupportedFixes(client);
            const requests = this.errorPusher
                .getErrorsAt(filePath, utils_1.pointToLocation(bufferPosition))
                .filter(error => error.code && supportedCodes.has(error.code))
                .map(error => client.executeGetCodeFixes({
                file: filePath,
                startLine: error.start.line,
                startOffset: error.start.offset,
                endLine: error.end.line,
                endOffset: error.end.offset,
                errorCodes: [error.code],
            }));
            const fixes = yield Promise.all(requests);
            const results = [];
            for (const result of fixes) {
                if (result.body) {
                    for (const fix of result.body) {
                        results.push({
                            priority: 100,
                            title: fix.description,
                            selected: () => {
                                fix.changes.forEach((fix) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                                    const { buffer, isOpen } = yield this.getTypescriptBuffer(fix.fileName);
                                    buffer.buffer.transact(() => {
                                        for (const edit of fix.textChanges) {
                                            buffer.buffer.setTextInRange(utils_1.spanToRange(edit), edit.newText);
                                        }
                                    });
                                    if (!isOpen) {
                                        buffer.buffer.save();
                                        buffer.on("saved", () => {
                                            buffer.buffer.destroy();
                                        });
                                    }
                                }));
                            },
                        });
                    }
                }
            }
            return results;
        });
    }
    getSupportedFixes(client) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let codes = this.supportedFixes.get(client);
            if (codes) {
                return codes;
            }
            const result = yield client.executeGetSupportedCodeFixes();
            if (!result.body) {
                throw new Error("No code fixes are supported");
            }
            codes = new Set(result.body.map(code => parseInt(code, 10)));
            this.supportedFixes.set(client, codes);
            return codes;
        });
    }
}
exports.CodefixProvider = CodefixProvider;
//# sourceMappingURL=codefixProvider.js.map