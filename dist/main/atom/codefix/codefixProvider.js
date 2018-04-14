"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
class CodefixProvider {
    constructor(clientResolver, errorPusher, applyEdits) {
        this.clientResolver = clientResolver;
        this.errorPusher = errorPusher;
        this.applyEdits = applyEdits;
        this.supportedFixes = new WeakMap();
    }
    async runCodeFix(textEditor, bufferPosition) {
        const filePath = textEditor.getPath();
        if (filePath === undefined)
            return [];
        const client = await this.clientResolver.get(filePath);
        const supportedCodes = await this.getSupportedFixes(client);
        const requests = this.errorPusher
            .getErrorsAt(filePath, utils_1.pointToLocation(bufferPosition))
            .filter(error => error.code !== undefined && supportedCodes.has(error.code))
            .map(error => client.execute("getCodeFixes", {
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
    async applyFix(fix) {
        return this.applyEdits(fix.changes);
    }
    dispose() {
        // NOOP
    }
    async getSupportedFixes(client) {
        let codes = this.supportedFixes.get(client);
        if (codes) {
            return codes;
        }
        const result = await client.execute("getSupportedCodeFixes", undefined);
        if (!result.body) {
            throw new Error("No code fixes are supported");
        }
        codes = new Set(result.body.map(code => parseInt(code, 10)));
        this.supportedFixes.set(client, codes);
        return codes;
    }
}
exports.CodefixProvider = CodefixProvider;
//# sourceMappingURL=codefixProvider.js.map