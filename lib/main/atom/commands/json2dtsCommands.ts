import * as atomUtils from "../atomUtils";
import * as parent from "../../../worker/parent";
import * as path from "path";
import {convert} from "../../json2dts/json2dts";

/**
 * register commands
 */
export function registerJson2dtsCommands() {
    atom.commands.add('atom-workspace', 'typescript:JSON-to-Definition', (e) => {
        if (!atomUtils.commandForTypeScript(e)) return;
        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        var selection = editor.getSelectedBufferRange();
        var text = editor.getSelectedText();
        var range = editor.getSelectedBufferRange();
        editor.setTextInBufferRange(range, convert(text));
    });
}
