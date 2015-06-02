import * as atomUtils from "../atomUtils";

export function showForCurrentEditor() {
    var ed = atomUtils.getActiveEditor();

    showForEditor(ed);
}

export function showForEditor(ed: AtomCore.IEditor) {
    atom.notifications.addInfo('Semantic view coming soon');
}