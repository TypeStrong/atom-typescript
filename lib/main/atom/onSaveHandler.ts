

///ts:import=atomConfig
import atomConfig = require('./atomConfig'); ///ts:import:generated

///ts:import=parent
import parent = require('../../worker/parent'); ///ts:import:generated

import {errorView, show} from "./views/mainPanelView";

///ts:import=debugAtomTs
import debugAtomTs = require('./debugAtomTs'); ///ts:import:generated

export function handle(event: { filePath: string; editor: AtomCore.IEditor }) {
    // As a fall back to make sure we sync up in case of anything bad happening elsewhere.
    var textUpdated = parent.updateText({ filePath: event.filePath, text: event.editor.getText() });

    // Refresh errors for file
    textUpdated.then(() => {
        // also invalidate linter
        atom.commands.dispatch(
            atom.views.getView(atom.workspace.getActiveTextEditor()),
            'linter:lint');

        parent.errorsForFile({ filePath: event.filePath })
            .then((resp) => errorView.setErrors(event.filePath, resp.errors));
    })

    show();

    // Compile on save
    parent.getProjectFileDetails({ filePath: event.filePath }).then(fileDetails => {
        if (!fileDetails.project.compileOnSave) return;
        if (fileDetails.project.compilerOptions.out) return;

        textUpdated.then(() => parent.emitFile({ filePath: event.filePath }))
            .then((res) => errorView.showEmittedMessage(res));
    });
}
