///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

///ts:import=atomConfig
import atomConfig = require('./atomConfig'); ///ts:import:generated

///ts:import=parent
import parent = require('../../worker/parent'); ///ts:import:generated

///ts:import=errorView
import errorView = require('./errorView'); ///ts:import:generated

///ts:import=debugAtomTs
import debugAtomTs = require('./debugAtomTs'); ///ts:import:generated

export function handle(event: { filePath: string; editor: AtomCore.IEditor }) {
    var textUpdated = parent.updateText({ filePath: event.filePath, text: event.editor.getText() });

    // update the project file
    parent.regenerateProjectGlob({ filePath: event.filePath });

    if (atomConfig.compileOnSave) {
        textUpdated.then(() => parent.emitFile({ filePath: event.filePath }))
            .then((res) => errorView.showEmittedMessage(res));
    }
}
