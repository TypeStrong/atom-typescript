var atomUtils = require("../atomUtils");
var htmltotsx_1 = require("../../react/htmltotsx");
function registerReactCommands() {
    atom.commands.add('atom-workspace', 'typescript:HTML-to-TSX', function (e) {
        if (!atomUtils.commandForTypeScript(e))
            return;
        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        var selection = editor.getSelectedBufferRange();
        var text = editor.getSelectedText();
        var range = editor.getSelectedBufferRange();
        editor.setTextInBufferRange(range, htmltotsx_1.convert(text, 4));
    });
}
exports.registerReactCommands = registerReactCommands;
