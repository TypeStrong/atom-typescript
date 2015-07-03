import * as atomUtils from "../atomUtils";
import * as parent from "../../../worker/parent";
import * as path from "path";
import {convert} from "../../react/htmltotsx";

/**
 * register commands
 */
export function registerReactCommands() {
    atom.commands.add('atom-workspace', 'typescript:HTML-to-TSX', (e) => {
        if (!atomUtils.commandForTypeScript(e)) return;

        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        var selection = editor.getSelectedBufferRange();

        var text = editor.getSelectedText();
        var range = editor.getSelectedBufferRange();
        editor.setTextInBufferRange(range, convert(text, 4));
    });
}