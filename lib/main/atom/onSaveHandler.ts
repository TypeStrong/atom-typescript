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
    // As a fall back to make sure we sync up in case of anything bad happening elsewhere.
    var textUpdated = parent.updateText({ filePath: event.filePath, text: event.editor.getText() });

    // Compile on save
    parent.getProjectFileDetails({ filePath: event.filePath }).then(fileDetails => {
        if (!fileDetails.project.compileOnSave) return;

        textUpdated.then(() => parent.emitFile({ filePath: event.filePath }))
            .then((res) => errorView.showEmittedMessage(res));
    });
}
