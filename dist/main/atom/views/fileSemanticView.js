var atomUtils = require("../atomUtils");
function showForCurrentEditor() {
    var ed = atomUtils.getActiveEditor();
    showForEditor(ed);
}
exports.showForCurrentEditor = showForCurrentEditor;
function showForEditor(ed) {
    atom.notifications.addInfo('Semantic view coming soon');
}
exports.showForEditor = showForEditor;
