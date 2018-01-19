"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
class CodefixProvider {
    constructor(clientResolver) {
        this.supportedFixes = new WeakMap();
        this.clientResolver = clientResolver;
    }
    async runCodeFix(textEditor, bufferPosition) {
        const filePath = textEditor.getPath();
        if (!filePath || !this.errorPusher || !this.clientResolver || !this.getTypescriptBuffer) {
            return [];
        }
        const client = await this.clientResolver.get(filePath);
        const supportedCodes = await this.getSupportedFixes(client);
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
        const fixes = await Promise.all(requests);
        const results = [];
        for (const result of fixes) {
            if (result.body) {
                for (const fix of result.body) {
                    results.push(fix);
                }
            }
        }
        return results;
    }
    async getSupportedFixes(client) {
        let codes = this.supportedFixes.get(client);
        if (codes) {
            return codes;
        }
        const result = await client.executeGetSupportedCodeFixes();
        if (!result.body) {
            throw new Error("No code fixes are supported");
        }
        codes = new Set(result.body.map(code => parseInt(code, 10)));
        this.supportedFixes.set(client, codes);
        return codes;
    }
    async applyFix(fix) {
        for (const f of fix.changes) {
            const { buffer, isOpen } = await this.getTypescriptBuffer(f.fileName);
            buffer.buffer.transact(() => {
                for (const edit of f.textChanges.reverse()) {
                    buffer.buffer.setTextInRange(utils_1.spanToRange(edit), edit.newText);
                }
            });
            if (!isOpen) {
                buffer.buffer.save().then(() => buffer.buffer.destroy());
            }
        }
    }
}
exports.CodefixProvider = CodefixProvider;
//# sourceMappingURL=codefixProvider.js.map