// This file is only called from linter
// See : https://github.com/AtomLinter/Linter/issues/337

///ts:import=utils
import utils = require('./main/lang/utils'); ///ts:import:generated
///ts:import=parent
import parent = require('./worker/parent'); ///ts:import:generated

import fs = require('fs');
import {Range} from "atom";

interface LinterError {
    message: string;
    line: number; // startline.
    range: any; // LinterRange([startline,startch],[endline,endch]);
    level: string; // 'error' | 'warning'
    linter: string; // linter name
}

interface LinterMessage {
    type: string, // "Error" or "Warning"
    text?: string,
    html?: string,
    filePath?: string,
    range?: TextBuffer.IRange,
    //  trace?: Array<Trace> // We don't care about this so I have this commented out
}

export var provider = {
    grammarScopes: ['source.ts'],
    scope: 'file', //  # or 'project'
    lintOnFly: true, // # must be false for scope: 'project'
    lint: (textEditor: AtomCore.IEditor): Promise<LinterMessage[]> => {

        if (!textEditor.buffer.file
            || !textEditor.buffer.file.path
            || !fs.existsSync(textEditor.buffer.file.path)) return Promise.resolve([]);

        var filePath = textEditor.buffer.file.path;

        return parent.errorsForFile({ filePath: filePath }).then((resp) => {
            var linterErrors: LinterMessage[] = resp.errors.map((err) => ({
                type: "Error",
                text: err.message,
                range: new Range([err.startPos.line, err.startPos.col], [err.endPos.line, err.endPos.col]),
            }));
            return linterErrors;
        });
    }
}



/* 


// We refuse to work on files that are not on disk.
if (!this.editor.buffer.file
    || !this.editor.buffer.file.path
    || !fs.existsSync(this.editor.buffer.file.path)) return callback([]);

filePath = this.editor.buffer.file.path;

parent.errorsForFile({ filePath: filePath }).then((resp) => {
    var linterErrors: LinterError[] = resp.errors.map((err) => <LinterError>{
        message: err.message,
        line: err.startPos.line + 1,
        range: new Rng([err.startPos.line, err.startPos.col], [err.endPos.line, err.endPos.col]),
        level: 'error',
        linter: 'TypeScript'
    });

    return callback(linterErrors);
});

*/