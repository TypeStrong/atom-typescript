"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../atom/utils");
class TSSigHelpProvider {
    constructor(getClient, flushTypescriptBuffer) {
        this.getClient = getClient;
        this.flushTypescriptBuffer = flushTypescriptBuffer;
        this.triggerCharacters = new Set(["(", ","]);
        this.grammarScopes = utils_1.typeScriptScopes();
        this.priority = 100;
    }
    async getSignatureHelp(editor, pos) {
        try {
            const filePath = editor.getPath();
            if (filePath === undefined)
                return;
            const client = await this.getClient(filePath);
            await this.flushTypescriptBuffer(filePath);
            const result = await client.execute("signatureHelp", {
                file: filePath,
                line: pos.row + 1,
                offset: pos.column + 1,
            });
            const data = result.body;
            const signatures = data.items.map(utils_1.signatureHelpItemToSignature);
            return {
                signatures,
                activeParameter: data.argumentIndex,
                activeSignature: data.selectedItemIndex,
            };
        }
        catch (e) {
            return;
        }
    }
}
exports.TSSigHelpProvider = TSSigHelpProvider;
//# sourceMappingURL=sigHelpProvider.js.map