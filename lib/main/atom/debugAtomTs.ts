

///ts:import=atomConfig
import atomConfig = require('./atomConfig'); ///ts:import:generated
///ts:import=typescriptGrammar
import typescriptGrammar = require('./typescriptGrammar'); ///ts:import:generated

import TokenClass = ts.TokenClass;

interface AtomTokenizeLineResult {
    tokens: any[];
    ruleStack: any[];
}

export function runDebugCode(details: { filePath: string; editor: AtomCore.IEditor }) {
    if (!atomConfig.debugAtomTs) return;

}
