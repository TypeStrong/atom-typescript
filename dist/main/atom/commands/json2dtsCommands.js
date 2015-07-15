var atomUtils = require("../atomUtils");
var json2dts_1 = require("../../json2dts/json2dts");
function registerJson2dtsCommands() {
    atom.commands.add('atom-workspace', 'typescript:JSON-to-Definition', function (e) {
        if (!atomUtils.commandForTypeScript(e))
            return;
        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        var selection = editor.getSelectedBufferRange();
        var text = editor.getSelectedText();
        var range = editor.getSelectedBufferRange();
        editor.setTextInBufferRange(range, json2dts_1.convert(text));
    });
}
exports.registerJson2dtsCommands = registerJson2dtsCommands;
