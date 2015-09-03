// This file is only called from linter
// See : https://github.com/AtomLinter/Linter/issues/337

///ts:import=utils
import utils = require('./main/lang/utils'); ///ts:import:generated
///ts:import=parent
import parent = require('./worker/parent'); ///ts:import:generated

import fs = require('fs');
import {Range} from "atom";

interface LinterMessage {
    type: string, // "Error" or "Warning"
    text?: string,
    html?: string,
    filePath?: string,
    range?: TextBuffer.IRange,
    //  trace?: Array<Trace> // We don't care about this so I have this commented out
}

export var provider = {
    grammarScopes: ['source.ts', 'source.ts.tsx'],
    scope: 'file', //  # or 'project'
    lintOnFly: true, // # must be false for scope: 'project'
    lint: (textEditor: AtomCore.IEditor): Promise<LinterMessage[]> => {

        // We do not support files not on disk
        if (!textEditor.buffer.file
            || !textEditor.buffer.file.path
            || !fs.existsSync(textEditor.buffer.file.path)) return Promise.resolve([]);

        var filePath = textEditor.buffer.file.path;

        return parent.errorsForFile({ filePath: filePath })
            .then((resp) => {
                var linterErrors: LinterMessage[] = resp.errors.map((err) => ({
                    type: "Error",
                    filePath,
                    html: `<span class="badge badge-flexible" style="color:rgb(0, 148, 255)"> TS </span> ${
                      err.message.replace(/\n/g,'<br />')
                    }`,
                    range: new Range([err.startPos.line, err.startPos.col], [err.endPos.line, err.endPos.col]),
                }));
                return linterErrors;
            })
            .catch((error) => {
                /**
                 * We catch these errors as the linter will do a full blown notification message on error
                 */
                return [];
            });
    }
}
