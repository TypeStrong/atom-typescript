///ts:import=parent
import parent = require('../../worker/parent'); ///ts:import:generated

import {panelView} from "./views/mainPanelView";

export var fileStatuses: Array<String> = [];

export function updateFileStatus(filePath: string, output: EmitOutput) {
    var status;
    if (output.emitError) {
        status = 'error';
    } else {
        status = 'success';
    }
    fileStatuses[filePath] = status;
    panelView.updateFileStatus(status);
}
