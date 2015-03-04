/// Functions that the parent allows the child to query

var resolve: typeof Promise.resolve = Promise.resolve.bind(Promise);

///ts:import=atomUtils
import atomUtils = require('../main/atom/atomUtils'); ///ts:import:generated
import tsconfig = require('../main/tsconfig/tsconfig');

export function echoNumWithModification(query: { num: number }): Promise<{ num: number }> {
    return Promise.resolve({ num: query.num + 10 });
}

export function getUpdatedTextForUnsavedEditors(query: {}): Promise<{ editors: { filePath: string; text: string }[] }> {
    var editors = atomUtils.getTypeScriptEditorsWithPaths().filter(editor => editor.isModified());
    return resolve({
        editors: editors.map(e=> {
            return { filePath: e.getPath(), text: e.getText() }
        })
    });
}

export function setProjectFileParsedResult(query: { projectFilePath: string; error?: Error }): Promise<{}> {
    
    return resolve({});
}
