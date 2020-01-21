"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const utils_1 = require("../atom/utils");
class TSSigHelpProvider {
    constructor(getClient) {
        this.getClient = getClient;
        this.triggerCharacters = new Set([]);
        this.grammarScopes = utils_1.typeScriptScopes();
        this.priority = 100;
        this.disposables = new atom_1.CompositeDisposable();
        const triggerCharsDefault = new Set(["<", "(", ","]);
        const triggerCharsDisabled = new Set([]);
        this.disposables.add(atom.config.observe("atom-typescript.sigHelpDisplayOnChange", newVal => {
            this.triggerCharacters = newVal ? triggerCharsDefault : triggerCharsDisabled;
        }));
    }
    dispose() {
        this.disposables.dispose();
    }
    async getSignatureHelp(editor, pos) {
        try {
            const filePath = editor.getPath();
            if (filePath === undefined)
                return;
            const client = await this.getClient(filePath);
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