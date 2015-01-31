///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

///ts:import=programManager
import programManager = require('../lang/programManager'); ///ts:import:generated


export function requestHandler(config: {
    program: programManager.Program;
    editor: AtomCore.IEditor;
    filePath: string;
    position: number;
}) {

    /*
    try {
        console.log(require('views/tooltip'));
    } catch (ex) {
        console.error(ex);
    }*/

    var signatures = config.program.languageService.getSignatureHelpItems(config.filePath, config.position);
    if (!signatures) return;

    // console.log(signatures);
}
