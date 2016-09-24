import * as parent from "./worker/parent";
import * as atomUtils from "./main/atom/atomUtils";
import {Set} from "immutable";

const TS_GRAMMARS = Set<string>(["source.ts", "source.tsx"]);

export let providerName = "typescript-hyperclick-provider";

export let wordRegExp = /([A-Za-z0-9_])+|['"`](\\.|[^'"`\\\\])*['"`]/g;

export function getSuggestionForWord(textEditor: AtomCore.IEditor, text: string, range: TextBuffer.IRange) {
    if (!TS_GRAMMARS.has(textEditor.getGrammar().scopeName)) {
        return null;
    }

    return {
        range: range,
        callback() {
            let filePathPosition = {
              filePath: textEditor.getPath(),
              position: atomUtils.getEditorPositionForBufferPosition(textEditor, range.start)
            };

            parent.getDefinitionsAtPosition(filePathPosition).then((res) => {
                if (res.definitions.length > 0) {
                    let definition = res.definitions[0];
                    atom.workspace.open(definition.filePath, {
                        initialLine: definition.position.line,
                        initialColumn: definition.position.col
                    });
                }
            });
        }
    };
}
