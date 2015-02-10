///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

///ts:import=atomConfig
import atomConfig = require('./atomConfig'); ///ts:import:generated

///ts:import=parent
import parent = require('../../worker/parent'); ///ts:import:generated

///ts:import=errorView
import errorView = require('./errorView'); ///ts:import:generated

export function handle(event: { filePath: string; editor: AtomCore.IEditor }) {

    // TODO: Review if it is "saveAs" and what impact it might have

    var textUpdated = parent.updateText({ filePath: event.filePath, text: event.editor.getText() });

    if (atomConfig.compileOnSave) {
        textUpdated.then(() => parent.emitFile({ filePath: event.filePath }))
            .then((res) => errorView.showEmittedMessage(res));
    }
}
