import * as parent from "./worker/parent";
import * as atomUtils from "./main/atom/atomUtils";
import {Set} from "immutable";

const TS_GRAMMARS = Set<string>(["source.ts", "source.tsx"]);

export let providerName = "typescript-hyperclick-provider";

export function getSuggestionForWord(textEditor: AtomCore.IEditor, text: string, range: TextBuffer.IRange) {
    return {
        range: range,
        callback() {
            if (!TS_GRAMMARS.has(textEditor.getGrammar().scopeName)) {
                return null;
            }

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
