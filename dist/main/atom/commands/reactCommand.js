var atomUtils = require("../atomUtils");
function register() {
    atom.commands.add('atom-workspace', 'typescript:HTML-to-TSX', function (e) {
        if (!atomUtils.commandForTypeScript(e))
            return;
        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        var selection = editor.getSelectedBufferRange();
        var text = editor.getSelectedText();
        var range = editor.getSelectedBufferRange();
        editor.setTextInBufferRange(range, "foo");
    });
}
exports.register = register;
