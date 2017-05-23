import {ClientResolver} from "../../client/clientResolver";
import {simpleSelectionView} from "./views/simpleSelectionView"

function open(item: {file: string, start: {line: number, offset: number}}) {
    atom.workspace.open(item.file, {
        initialLine: item.start.line - 1,
        initialColumn: item.start.offset - 1
    });
}

export function getHyperclickProvider(clientResolver: ClientResolver): any {
    return {
        providerName: "typescript-hyperclick-provider",
        wordRegExp: /([A-Za-z0-9_])+|['"`](\\.|[^'"`\\\\])*['"`]/g,
        getSuggestionForWord(textEditor: AtomCore.IEditor, text: string, range: TextBuffer.IRange) {
            const TS_GRAMMARS = ["source.ts", "source.tsx"];
            if (TS_GRAMMARS.indexOf(textEditor.getGrammar().scopeName) === -1) {
                return null;
            }

            return {
                range: range,
                callback: async () => {
                    const client = await clientResolver.get(textEditor.getPath());
                    const pos = textEditor.getCursorBufferPosition();
                    const result = await client.executeDefinition({
                        file: textEditor.getPath(),
                        line: pos.row + 1,
                        offset: pos.column + 1
                    });
                    if (!result.body) {
                        return
                    } else if (result.body.length === 1) {
                        open(result.body[0]);
                    } else if (result.body.length > 1) {
                        simpleSelectionView({
                          items: result.body,
                          viewForItem: ({file, start}) =>
                            `<span>${file}</span>
                             <div class="pull-right">
                                line: ${start.line}
                             </div>`,
                          filterKey: 'filePath',
                          confirmed: open
                      });
                    }
                }
            };
        }
    }
}
